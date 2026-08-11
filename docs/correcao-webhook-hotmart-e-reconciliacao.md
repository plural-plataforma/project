# Correção do webhook Hotmart + reconciliação automática de assinaturas

Data: 2026-08-10
Escopo: `apps/api` (backend). Sem mudança de frontend, sem mudança de UI.

## Contexto e motivação

A cliente relatou (áudio + prints) que precisa digitar manualmente a "Data de Expiração" de
cada professora no admin, toda vez que alguém compra — mesmo o cadastro vindo automático da
Hotmart. Isso apontava pra algo quebrado no fluxo automático de expiração.

## Causa raiz encontrada

O `HotmartWebhookV2Dto` (DTO que recebe o JSON do webhook da Hotmart) não tinha nenhum
`[JsonPropertyName]`, e o projeto não tem nenhuma política de serialização snake_case
configurada (`Program.cs` não define `PropertyNamingPolicy`). O binding padrão do
`System.Text.Json` é case-insensitive, mas **não remove underscore** — então `warranty_date`
(JSON da Hotmart) nunca batia com `WarrantyDate` (propriedade C#) e ficava sempre `null`.

Isso só não quebrava campos de uma palavra só (`email`, `name`, `id`) — por isso ninguém
notou antes: cadastro, e-mail e nome sempre funcionaram, só a expiração ficava muda.

Consequência prática: **todo** professor criado automaticamente via Hotmart nasceu vitalício
(`ExpirationDate = null`), desde sempre — não era um problema só de renovação, o cadastro
inicial nunca setou expiração nenhuma.

Segundo problema, independente do primeiro: quando o webhook chegava pra um e-mail que já
existia no banco (ou seja, uma renovação), o código antigo simplesmente logava e **retornava
sem fazer nada**. Ou seja, mesmo corrigindo o binding, renovações continuariam sem estender o
acesso.

## O que foi corrigido

### 1. Binding correto do JSON da Hotmart
`DTOs/Webhooks/HotmartPurchaseWebhookDto.cs`
- `[JsonPropertyName("...")]` em todo campo snake_case do payload (`warranty_date`,
  `first_name`, `last_name`, `has_co_production`, `is_physical_product`, `document_type`,
  etc).
- `Purchase` e `Subscription`, que antes eram classes vazias (`{ /* ... */ }`), ganharam os
  campos reais: `recurrence_number`, `date_next_charge`, `status`, `subscription.status`,
  `subscription.subscriber.code`.
- Escopo da correção é só esse arquivo — não mexi em política global de JSON da API (isso
  quebraria todo o resto, que usa camelCase).

### 2. Fonte da expiração trocada
Antes: `product.warranty_date` (prazo de garantia/reembolso do produto — sem relação com
vencimento de assinatura).
Agora: `purchase.date_next_charge` (data da próxima cobrança = vencimento real do acesso já
pago), confirmado na documentação oficial da Hotmart
(`developers.hotmart.com/docs/en/2.0.0/webhook/purchase-webhook/`). `warranty_date` só entra
como fallback se a Hotmart não mandar dado de recorrência.

### 3. Renovação passou a estender o acesso
`Services/HotmartWebhookService.cs`
- `PURCHASE_APPROVED` num e-mail/assinante que já existe no banco agora **atualiza**
  `ExpirationDate` em vez de ignorar o evento.
- Idempotência trocada: antes só olhava e-mail; agora tenta achar primeiro pelo novo campo
  `HotmartSubscriberCode` (identificador estável da assinatura), com fallback pra e-mail.

### 4. Corte de acesso em reembolso/chargeback
- Eventos `PURCHASE_REFUNDED` e `PURCHASE_CHARGEBACK` agora desativam o usuário
  (`IsActive = false`) imediatamente.

### 5. Cancelamento de assinatura (evento novo, não tratado antes)
- Novo handler pro evento `SUBSCRIPTION_CANCELLATION`. Não corta o acesso na hora — mantém
  válido até `date_next_charge`, exatamente como a Hotmart documenta (cliente cancelado
  continua com acesso até o fim do período que já pagou, só não é cobrado de novo).

### 6. Troca de dia de cobrança (evento novo, não tratado antes)
- Novo handler pro evento `UPDATE_SUBSCRIPTION_CHARGE_DATE`. Se a professora (ou a cliente,
  pelo painel) mudar o dia de cobrança de uma assinatura, `ExpirationDate` sincroniza sozinho.
  Particularidade: nesse evento específico a Hotmart manda `date_next_charge` como string ISO
  (`"2022-09-01T12:00:00.000Z"`), não como epoch em milissegundos como nos outros eventos —
  tratado à parte no DTO.

### 7. Reconciliação diária (rede de segurança, não existia antes)
`Services/HotmartService.cs` (método novo `GetAssinaturasAsync`, reaproveitando o OAuth que já
existia ali pra outra finalidade) + `Services/HotmartReconciliacaoAssinaturasJob.cs` (novo,
`BackgroundService` registrado no `Program.cs`).
- Roda a cada 24h.
- Consulta a API oficial da Hotmart (`GET /payments/api/v1/subscriptions`) por todas as
  assinaturas `ACTIVE`/`DELAYED`/`OVERDUE`/`STARTED` do produto.
- Casa cada uma com o usuário local por `HotmartSubscriberCode` (fallback e-mail). Se
  `ExpirationDate` local divergir mais de 24h do que a Hotmart informa, corrige e loga um
  warning.
- Não substitui o webhook — é um reforço pra webhook perdido, atrasado, ou entrega falhou.

### 8. Nova coluna
`Models/Usuario.cs` — `HotmartSubscriberCode` (`string?`). Identificador estável da assinatura
na Hotmart, usado pelos itens 3, 5, 6 e 7 acima pra casar eventos de forma mais confiável que
e-mail (e-mail pode mudar; o código do assinante não).

## Arquivos alterados

| Arquivo | Tipo |
|---|---|
| `apps/api/Models/Usuario.cs` | modificado |
| `apps/api/DTOs/Webhooks/HotmartPurchaseWebhookDto.cs` | modificado |
| `apps/api/Services/HotmartWebhookService.cs` | modificado |
| `apps/api/Services/HotmartService.cs` | modificado |
| `apps/api/Services/HotmartReconciliacaoAssinaturasJob.cs` | novo |
| `apps/api/Controllers/WebhooksController.cs` | modificado |
| `apps/api/Program.cs` | modificado (registro do job) |

## O que precisa ser feito manualmente (fora do meu escopo)

**1. Migration** (schema novo, coluna `HotmartSubscriberCode`):
```bash
dotnet ef migrations add AddHotmartSubscriberCodeToUsuario
dotnet ef database update
```

**2. Painel Hotmart → configuração de Webhook**: confirmar que estes eventos estão marcados
pra essa mesma URL (`/api/webhooks/hotmart`), além do `PURCHASE_APPROVED` que já deve estar:
- `PURCHASE_REFUNDED`
- `PURCHASE_CHARGEBACK`
- `SUBSCRIPTION_CANCELLATION`
- `UPDATE_SUBSCRIPTION_CHARGE_DATE`

Sem isso marcado no painel, o código novo nunca é chamado pra esses casos — a Hotmart só
manda o que está configurado.

**3. Variáveis de ambiente no servidor de produção**: `HotmartService.cs` (reaproveitado pra
reconciliação) exige `API_HOTMART_URL`, `HOTMART_TOKEN_URL`, `HOTMART_CLIENT_ID`,
`HOTMART_CLIENT_SECRET`. Não estão no `appsettings.json` do repo — precisam existir como env
var na hospedagem. Se `VendasController` (que já usava esse mesmo serviço antes dessa mudança)
funciona hoje em produção, essas variáveis já estão configuradas.

**4. Git**: eu não faço `add`/`commit`/`push` — só deixo os arquivos prontos. Comandos e
mensagem sugerida no fim deste documento.

## Importante: não é retroativo

Essa correção vale só pra eventos novos, a partir de agora. Quem já foi cadastrado antes
continua com a expiração que já tem hoje no banco (majoritariamente `null`/vitalício, dado o
bug). Corrigir a base existente é decisão separada — dá pra rodar um script pontual depois,
mas não fiz isso sozinho.

## Ressalva técnica sobre a reconciliação

A documentação oficial da Hotmart pro endpoint `GET /subscriptions` descreve
`date_next_charge` como "milissegundos desde epoch", mas o próprio exemplo de resposta na
mesma página mostra um valor de 10 dígitos — o que é segundos, não milissegundos. É uma
inconsistência da documentação deles. Implementei uma heurística de magnitude
(`ConverterDataApi` em `HotmartReconciliacaoAssinaturasJob.cs`) que trata os dois casos, mas
recomendo validar contra uma resposta real (sandbox ou produção) antes de confiar 100% nesse
número — está comentado no código pra facilitar achar depois.

## Testes recomendados antes de considerar fechado

Usando o Sandbox da Hotmart (`developers.hotmart.com/docs/en/start/sandbox/`):
- Simular `PURCHASE_APPROVED` de uma compra nova → conferir que `ExpirationDate` do usuário
  criado bate com `date_next_charge` do payload, não com `warranty_date`.
- Simular uma segunda cobrança pro mesmo comprador (renovação, `recurrence_number: 2`) →
  conferir que `ExpirationDate` avança, em vez de o evento ser ignorado.
- Simular `SUBSCRIPTION_CANCELLATION` → conferir que `ExpirationDate` vira a data do fim do
  período já pago, não a data de agora.
- Simular `PURCHASE_REFUNDED` → conferir `IsActive = false` na hora.
- Depois do primeiro deploy, checar os logs ~24h depois procurando por "Reconciliação Hotmart
  concluída" pra confirmar que o job rodou sem erro.

## Commit sugerido

```
fix(hotmart): corrige binding snake_case do webhook e passa a controlar expiração via date_next_charge

Nenhum campo snake_case do payload da Hotmart tinha [JsonPropertyName], então
warranty_date, first_name etc sempre chegavam null — todo cadastro automático
nascia vitalício. Corrige o binding, troca a fonte da expiração pra
date_next_charge (vencimento real, não garantia), passa a estender o acesso em
renovações (antes era ignorado), adiciona handlers para SUBSCRIPTION_CANCELLATION,
UPDATE_SUBSCRIPTION_CHARGE_DATE, PURCHASE_REFUNDED/CHARGEBACK, e um job diário de
reconciliação via API como rede de segurança contra webhook perdido.
```
