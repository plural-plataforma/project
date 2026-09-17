# Incidente 2026-09-17: timeout no login para professora com conexão ruim

Data: 2026-09-17
Escopo: `apps/api/Program.cs`.
Nenhuma mudança de schema, nenhuma migration, nenhuma mudança de contrato da API.

Origem: relato via suporte (WhatsApp, 16/09 e 17/09) de professora que não conseguia entrar na
plataforma a partir da rede dela, em mais de um computador, enquanto a equipe entrava
normalmente com a mesma conta. A conta é compartilhada com outra professora.

---

## Sintoma

Tela de login com:

```
O servidor demorou demais para responder. Verifique sua conexão e tente de novo.
Informe ao suporte: Timeout · POST /Autenticacao/login
```

A mensagem vem do `ECONNABORTED` do axios (`apps/web-app/src/lib/apiFriendlyError.ts`), ou seja,
nenhuma resposta chegou ao navegador em 30s (`timeout` em `apps/web-app/src/api/http.ts`). Em
outros momentos, no mesmo notebook, o painel abria.

## Investigação

Logs de produção `logs/log-20260915.txt` a `log-20260917.txt` (horário do servidor `+02:00`,
BRT = servidor − 5h). O log não grava IP nem e-mail; a correlação abaixo é por horário e pelo
tamanho do corpo do POST.

### 1. O servidor responde todo login rápido

Todos os `POST /api/Autenticacao/login` registrados nos três dias terminaram, com duração
máxima de 2,9s. Nenhum reinício da aplicação perto dos horários relatados, queries do banco
abaixo de 500ms e tráfego baixo (3 a 10 requisições por minuto).

`AutenticacaoService.Login` não chama serviço externo, não há rate limiter e
`CheckPasswordAsync` não incrementa lockout. Dividir a conta não causa timeout: o JWT não tem
estado e não existe sessão única.

### 2. As tentativas dela chegaram e foram respondidas

Payload `{"email":"...","senha":"..."}` com o e-mail da conta: senha de 8 caracteres = 57
bytes, senha de 11 caracteres = 60 bytes — as duas senhas que aparecem nos prints. Em 17/09
(BRT):

```
08:31–08:57  len=57 -> 401 (20 tentativas, ~0,4s cada)
08:57:56     len=60 -> 200 (print do painel aberto às ~09h)
09:28–09:31  len=57 -> 401
09:46:30     len=60 -> 200
09:47:30     len=60 -> 200
```

O print das 09:48 mostra **timeout** com a senha de 8 caracteres, mas o servidor devolveu
`401` em 0,4s. A resposta levou mais de 30s para voltar. É indício forte, não prova: outra
conta poderia ter payload do mesmo tamanho.

### 3. Latência extrema concentrada nas janelas de uso dela

Métrica: tempo entre o `OPTIONS` (preflight) e a requisição real do mesmo path, que
normalmente fica abaixo de 1s. "Órfão" = preflight sem requisição real em 60s.

| Janela (BRT) | Mediana | p90 | Órfãos |
| --- | --- | --- | --- |
| 15/09 14h–16h | 7,8s–15s | 18s–24s | 10 |
| 16/09 15h–16h | 1,2s–2,8s | 44s–50s | 110 |
| 17/09 09:00–09:29 | 21s | 45s | 66 |
| Demais horários | 0,3s–0,6s | < 1,5s | ~0 |

### 4. Resposta grande demorando a trafegar

`GET /api/Planejamento/buscar` terminou em 16s–29s às 09:48 e 09:50 de 17/09 (horário dos
prints), com as queries do mesmo request abaixo de 400ms. O tempo é de escrita da resposta
para um cliente lento, não de processamento.

## Causa

Conexão da professora até o servidor (MonsterASP, Hetzner, Alemanha, `178.63.129.220`) com
perda de pacotes ou latência extrema. As requisições chegam, o servidor responde rápido, mas
as respostas não voltam dentro dos 30s do front. Aconteceu na rede de casa e na do trabalho,
então o problema pode estar no provedor ou na rota da região, e não só no Wi-Fi.

A equipe não reproduz porque está em redes sem esse problema.

Dois fatores do nosso lado pioram o quadro para quem tem conexão ruim:

- Preflight sem `Access-Control-Max-Age`: o Chrome guarda por 5s, então quase toda chamada
  autenticada faz duas idas e voltas.
- Nenhuma compressão de resposta configurada na API: listagens JSON trafegam cruas.

## Correção aplicada no código

`apps/api/Program.cs`:

1. `.SetPreflightMaxAge(TimeSpan.FromHours(2))` na política `AllowLocalhost` — teto que o
   Chromium respeita. Corta o preflight repetido.
2. `AddResponseCompression` (Brotli + Gzip, `CompressionLevel.Optimal`, `EnableForHttps`) e
   `app.UseResponseCompression()` logo após `UseForwardedHeaders`. MIME types padrão: comprime
   JSON e texto, não mexe em PDF, DOCX e imagens.
   - Risco BREACH avaliado: a autenticação é Bearer em header, que o navegador não anexa em
     requisição cross-site, então o ataque não se aplica.

Sem mudança de contrato: web-app, admin e mobile continuam iguais.

### Verificação após deploy

Pendente. Comandos:

```bash
dotnet build apps/api/api.csproj
dotnet test apps/api.Tests

# Preflight deve trazer access-control-max-age: 7200
curl -s -D - -o /dev/null -X OPTIONS \
  -H "Origin: https://app.pluralplataforma.com" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: authorization" \
  https://plural.runasp.net/api/Planejamento/buscar | grep -i access-control-max-age

# Resposta autenticada deve trazer content-encoding: br
curl -s -D - -o /dev/null -H "Accept-Encoding: br, gzip" \
  -H "Authorization: Bearer <TOKEN>" \
  https://plural.runasp.net/api/Planejamento/buscar | grep -i content-encoding
```

Se o IIS do MonsterASP já tiver compressão dinâmica ligada, ele ignora respostas que chegam com
`Content-Encoding` definido — sem dupla compressão.

No web-app: DevTools → Network, conferir `content-encoding: br` e o tamanho transferido menor
em `Planejamento/buscar`.

---

## Decisão: sem domínio próprio para a API

Colocar a API atrás da Cloudflare em `api.pluralplataforma.com` exigiria adicionar domínio no
MonsterASP (pago) e migrar os nameservers da HostGator. Descartado em 17/09: só esta usuária é
afetada, a equipe acessa normalmente e os logs mostram o servidor respondendo rápido — o
problema está na conexão dela.

Se o padrão aparecer em mais usuárias, há opções sem custo de domínio no MonsterASP, a avaliar
na hora:

- Cloudflare Worker em `*.workers.dev` repassando para `plural.runasp.net`.
- Rewrite na Vercel de `app.pluralplataforma.com/api/*` para `plural.runasp.net/api/*`
  (mesma origem, elimina o preflight de CORS). Conferir antes o timeout de rewrite externo da
  Vercel contra os endpoints de IA.

---

## Pendências

| # | Item | Observação |
| --- | --- | --- |
| 1 | Teste do lado da professora | Roteador do 4G no mesmo notebook; `ping -n 50 plural.runasp.net` e `tracert plural.runasp.net` no CMD. Confirma a rota ruim e serve de referência para comparar depois. |
| 2 | Redefinir senha da conta | Duas senhas apareceram em fotos enviadas por WhatsApp, e uma delas é a que funciona. Conferir também se outras contas ainda usam a senha padrão de cadastro. |
| 3 | Conta compartilhada | Duas professoras numa conta só. Decisão comercial com a PO. |
| 4 | Payload de `Planejamento/buscar` | A listagem traz encontros, habilidades, estratégias e alunos de todos os planejamentos, e o dashboard a carrega inteira (contagem e `computeDashboardInsights`). Enxugar muda contrato consumido por quatro telas do web-app e pelo mobile — avaliar só se a compressão não bastar. |
| 5 | API na Alemanha, banco em `sa-east-1` | Toda query cruza o Atlântico (~180ms por comando nos logs). Não causa este incidente, mas pesa em qualquer tela com muitas queries. Avaliar hospedagem da API no Brasil ou nos EUA (leste). |

## Arquivos alterados neste lote

```
apps/api/Program.cs
docs/incidente-2026-09-17-timeout-login-rede-lenta.md (este arquivo)
```
