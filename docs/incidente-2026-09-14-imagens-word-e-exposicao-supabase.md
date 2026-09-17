# Incidente 2026-09-14: imagens ausentes no Word + banco de produção exposto pela Data API

Data: 2026-09-14
Escopo: `apps/api`, `apps/web-app`, configuração do projeto Supabase de produção
(`cebbltgweqjqwuocumof`). Nenhuma mudança de schema, nenhuma migration.

Origem: relato de professora via gestora (WhatsApp, 14/09 18:39) de que as atividades abriam
sem imagem no documento Word da Avaliação Diagnóstica, acompanhado de prints do advisor do
Supabase com 49 alertas `rls_disabled_in_public`.

---

## Parte 1 — Bug: "(Imagem não disponível)" no Word da Avaliação Diagnóstica

### Sintoma

Toda atividade do `.docx` da Avaliação Diagnóstica saía com o texto `(Imagem não disponível)`
no lugar da imagem. O PDF (gerado no servidor) e a exibição das imagens no admin não eram
afetados.

### Causa raiz

A imagem da atividade é hospedada no ImgBB (`i.ibb.co`), com upload feito direto do navegador
em `apps/web/src/pages/Atividades/CadastroDeAtividade.tsx`. O export Word roda no navegador e
fazia `fetch(url)` no host externo para ler os bytes.

O ImgBB não devolve o cabeçalho `Access-Control-Allow-Origin` (verificado com `curl` enviando
`Origin`). Sem CORS, o `fetch` falha, cai no `catch`, a imagem vira `null` e o export escreve
o texto de fallback.

Por que só o Word quebrava:

- `<img src>` não exige CORS — por isso a imagem aparece na tela do admin.
- O PDF é montado no servidor (`AvaliacaoDiagnosticaService.GerarPdfDiagnosticoAsync`, que
  baixa via `HttpClient`), onde CORS não existe.
- O `.docx` é montado no cliente, que precisa dos bytes na mão — único caminho sujeito a CORS.

### Correção aplicada

Proxy no servidor, espelhando o caminho que o PDF já usava. A URL vem do banco pelo id da
atividade, nunca do cliente, então não abre SSRF.

- `apps/api/DTOs/Atividade/AtividadeImagemDTO.cs` (novo): bytes + content type.
- `apps/api/Services/AtividadeService.cs`: injeta `IHttpClientFactory`; novo
  `GetImagemAtividade(int id)`, que valida esquema http/https, baixa com timeout de 30s e
  devolve o conteúdo.
- `apps/api/Controllers/AtividadesController.cs`: `GET api/atividades/{id}/imagem`, com
  `[Authorize]` e `Cache-Control: private, max-age=3600`.
- `apps/web-app/src/services/atividadeService.ts` (novo): `baixarImagemAtividade`, via cliente
  axios da aplicação (Bearer pelo interceptor).
- `apps/web-app/src/lib/exportAvaliacaoDiagnosticaDocx.ts`: mapa de imagens passa a ser
  indexado por id da atividade, com dedupe, e a busca vai pela API.

O fallback `(Imagem não disponível)` permanece para atividade sem imagem cadastrada ou host
fora do ar.

### Verificação em produção

- `dotnet build apps/api/api.csproj` e `npm --prefix apps/web-app run typecheck`: limpos
  (somente avisos pré-existentes, `CS8632` e `NU1902`).
- `GET https://plural.runasp.net/api/atividades/1/imagem` sem token: `401` (endpoint no ar).
- Requisição real do front: `GET /api/atividades/172/imagem` → `200 OK`, `image/png`,
  28.996 bytes.
- Word baixado pela plataforma: imagens presentes nas atividades.

### Pendência conhecida

Se alguma imagem tiver sido apagada no ImgBB, o proxy devolve `404` e a atividade continua sem
imagem — nesse caso é preciso reupload pelo admin. Varredura sugerida:

```sql
select id, titulo, imagem_url from atividade where imagem_url is not null order by id;
```

```bash
while read -r u; do printf "%s %s\n" "$(curl -s -o /dev/null -w '%{http_code}' "$u")" "$u"; done < urls.txt
```

---

## Parte 2 — Exposição do banco de produção pela Data API do Supabase

### O que estava acontecendo

O advisor apontava 49 tabelas do schema `public` sem RLS. A investigação mostrou que não era
alerta teórico:

| Verificação | Resultado |
| --- | --- |
| `rowsecurity` nas tabelas de `public` | `false` em todas as 49 |
| Grants de `anon` e `authenticated` | `SELECT`, `INSERT`, `UPDATE`, `DELETE`, `TRUNCATE`, `REFERENCES`, `TRIGGER` nas 49 tabelas |
| `Automatically expose new tables` | Ligado — cada tabela nova nascia exposta |
| Chave `anon` | Embutida no bundle do admin (`VITE_SUPABASE_ANON_KEY` em `apps/web/src/lib/uploadToSupabaseStorage.ts`) |

Combinação: qualquer pessoa com a chave `anon` — legível no JavaScript público do admin — podia
ler, alterar e esvaziar todas as tabelas de produção pela URL do projeto, sem login na
plataforma. Inclui `alunos`, `laudos`, `estudos_caso`, `relatos_atendimento`,
`relatorios_pedagogicos` e `aspnetusers`: dado pessoal sensível de estudantes com deficiência.

### Por que a correção não tinha risco para a API

Diagnóstico rodado antes de qualquer alteração:

- `postgres`: `rolsuper = false`, `rolbypassrls = true`, e owner das 49 tabelas.
- `anon`, `authenticated`, `authenticator`: sem `rolsuper` e sem `rolbypassrls`.
- `service_role`: `rolbypassrls = true`.

A API .NET conecta via `UseNpgsql` (`apps/api/Program.cs:165`) como `postgres` — owner e com
bypass — e não tem nenhuma referência a `supabase`, `/rest/v1` ou chave `anon` no código. Os
papéis `anon`/`authenticated` existem apenas para o PostgREST, que nada no monorepo consome.
Logo, habilitar RLS e revogar grants em `public` não altera o comportamento da API.

O único uso de chave Supabase no projeto é o upload de imagem de artigo do admin
(`apps/web/src/lib/uploadToSupabaseStorage.ts`), que bate em `/storage/v1`, schema `storage` —
fora do escopo das mudanças.

### O que foi aplicado em produção (14/09, noite)

1. Revoke dos privilégios de `anon` e `authenticated` em todas as tabelas, sequências e funções
   de `public`, mais `alter default privileges ... revoke` para tabela futura.
2. RLS habilitada nas 49 tabelas, sem política nenhuma (acesso via Data API = nenhum; a API
   segue passando por ser owner com bypass).
3. Conferência: grants de `anon`/`authenticated` vazios, nenhuma tabela com
   `rowsecurity = false`, nenhuma política em `public`.
4. Teste de fumaça na plataforma publicada: login e leitura de dados normais, sem regressão.
5. Data API desligada: `public` removido de *Exposed schemas* (`1 of 2 schemas exposed`), com
   o painel confirmando `0 of 49 tables exposed`.

Script com os blocos, conferências e rollback: `docs/seguranca-rls-supabase.sql`.

### Pendências

| # | Item | Observação |
| --- | --- | --- |
| 1 | Logs `/rest/v1` | Verificado em 14/09 à noite (Logs → Edge Logs, filtro `path like '/rest/v1%'`): nenhuma chamada de terceiro. As únicas entradas são health checks da própria infraestrutura (`@supabase-infra/mgmt-api`), incluindo um `GET /rest/v1/` na raiz, sem nome de tabela, já posteriores à correção. **Ressalva:** a janela de retenção do plano free cobre apenas as últimas horas, não o período em que a brecha existiu — a conclusão é "sem registro de acesso indevido na janela disponível", não "não houve acesso". Não há como recuperar log anterior neste plano. |
| 2 | Billing + backup | Projeto no plano free com grace period encerrado: ao esgotar a quota, para de responder. Painel também indica ausência de backup automático. Decisão de custo com a PO. |
| 3 | Banco de dev | Mesmos passos 1 a 5. Prioridade menor se os dados forem fictícios; igual à de produção se houver cópia de dado real. |
| 4 | `VITE_SUPABASE_ANON_KEY` e `VITE_IMGBB_API_KEY` no bundle | Prefixo `VITE_` embute a chave no JavaScript público. Correção: upload deixa de sair do navegador e passa por endpoint da API, que guarda a credencial no servidor. Ver decisão aberta abaixo. |
| 5 | Rotação de chaves | Depois do item 4: rotacionar a `anon` do Supabase e a chave do ImgBB, porque as atuais circularam em bundle público. Confirmar antes se o `VITE_SUPABASE_URL` do admin publicado aponta para produção ou para dev. |
| 6 | `Automatically expose new tables` | Hoje o toggle não aparece porque `public` não está exposto. Se `public` voltar à lista, precisa estar desligado, senão a próxima migration do EF expõe a tabela nova. Registrar junto do procedimento de migration. |

### Decisão aberta (item 4)

Ao mover o upload para a API, as imagens de atividade que já estão no ImgBB podem:

- **(a)** ser migradas para o Supabase Storage por script (baixa, re-sobe, atualiza
  `atividade.imagem_url`), tirando a dependência do host gratuito de vez; ou
- **(b)** permanecer no ImgBB, com apenas o upload novo passando pela API e pelo Storage.

Em aberto até avaliação. O proxy da Parte 1 mantém o Word funcionando nos dois casos.

---

## Arquivos alterados neste lote

```
apps/api/DTOs/Atividade/AtividadeImagemDTO.cs          (novo)
apps/api/Services/AtividadeService.cs
apps/api/Controllers/AtividadesController.cs
apps/web-app/src/services/atividadeService.ts          (novo)
apps/web-app/src/lib/exportAvaliacaoDiagnosticaDocx.ts
docs/seguranca-rls-supabase.sql                        (novo)
docs/incidente-2026-09-14-imagens-word-e-exposicao-supabase.md (este arquivo)
```

## Fora de escopo deste lote

Feedback de teste da Sabrina (12/09), que depende de definição de produto:

1. Relatório Pedagógico gerado em seções numeradas, sem opção de texto corrido — o texto de
   cada seção já é corrido; o pedido é de apresentação, como o alternador que o Estudo de Caso
   já tem.
2. Campo "Notas manuais" só entra no texto via "Reescrever com IA", o que tende a gerar uso
   alto de IA. Proposta dela: editar direto no campo Texto e salvar a seção (zero IA), deixando
   a IA apenas no botão opcional de melhorar texto.
