# Aceite de Termos de Uso (LGPD) — Design

## Contexto

A cliente enviou uma análise de adequação LGPD (não um termo pronto). Um dos pontos
urgentes apontados é criar Termos de Uso e mecanismo de aceite. Hoje existe apenas um
checkbox `AceitouTermos` (bool) preenchido no cadastro — sem versionamento, sem texto
vinculado, e sem gate para usuárias já cadastradas antes da feature.

Este design cobre: modelo de dados versionado, endpoints, e o gate nos apps de usuária
(`web-app` e `mobile`) para toda professora, inclusive quem já tem conta.

Fora de escopo (adiado por decisão explícita): tela de admin para CRUD de termos (novas
versões entram via migration/seed); Admin/Embaixadora não precisam aceitar (só role
Professor); opção de "adiar" o aceite (não existe — é bloqueio total).

## Modelo de dados (novo)

```
Termo
  Id            (PK)
  Chave         (string, único — ex: "uso_ferramenta")
  Nome          (string — ex: "Termos de Uso da Ferramenta")

TermoVersao
  Id            (PK)
  TermoId       (FK -> Termo)
  Versao        (int, incremental por Termo)
  Texto         (text — HTML simples)
  PublicadoEm   (datetime)
  Ativo         (bool — só uma versão Ativo=true por TermoId)

AceiteTermo
  Id              (PK)
  UsuarioId       (FK -> AspNetUsers/Usuario)
  TermoVersaoId   (FK -> TermoVersao)
  DataAceite      (datetime)
  Ip              (string?, nullable — auditoria)
```

Trocar o texto de um termo = criar `TermoVersao` nova com `Versao+1` e `Ativo=true`,
desativando a versão anterior (`Ativo=false`). Versões antigas nunca são editadas —
ficam como rastro histórico (quem aceitou o quê, quando).

Pendência de aceite para um usuário = existe `TermoVersao.Ativo=true` sem `AceiteTermo`
correspondente para aquele `UsuarioId`.

## Backend: endpoints novos

`AppDbContext`: adicionar os 3 `DbSet` acima + migration.

- `GET /api/termos/pendentes` (autenticado, role Professor)
  Retorna lista de `{ termoVersaoId, chave, nome, versao, texto }` para as versões
  ativas ainda não aceitas pelo usuário logado. Lista vazia = nada pendente.

- `POST /api/termos/aceitar` (autenticado, role Professor)
  Body: `{ termoVersaoId }`. Grava `AceiteTermo` (idempotente — se já existe, no-op
  retorna sucesso). Captura IP da request via `HttpContext.Connection.RemoteIpAddress`.

Novo `TermoService` + `TermosController`, seguindo o padrão de `ServiceResponse<T>` e
demais controllers do projeto (`[Authorize(Roles = "Professor")]`).

## Gate nos apps (web-app + mobile)

Hoje nenhum dos dois apps faz round-trip ao servidor no boot — só decodificam o JWT
salvo localmente (`AuthContext`). Isso não pega sessão já aberta de usuária que
cadastrou antes da feature existir. Solução: sempre que a rota protegida monta (sessão
ativa), chamar `GET /api/termos/pendentes` uma vez — mesmo padrão do gate de onboarding
que já existe em `web-app/src/routes/ProtectedRoute.tsx:26`.

**web-app** (`ProtectedRoute.tsx`): após o check de `isLoggedIn` e antes do check de
onboarding, chama `termosPendentesQuery` (react-query). Se vier pendência, renderiza
`<Navigate to="/aceitar-termos" />`. Nova página `AceitarTermosPage.tsx`: mostra o texto,
botão único "Aceitar e continuar" (sem botão de recusar/adiar), chama o POST, e ao
suceder libera navegação para o destino original.

**mobile**: mesmo mecanismo em `app/dashboard/_layout.tsx` (layout raiz das telas
autenticadas), seguindo o padrão de `precisaTrocarSenha` em `dashboard/index.tsx:166`,
navegando para uma tela `aceitar-termos` full-screen sem opção de voltar
(`router.replace`, sem botão de back habilitado).

Sem alterações no fluxo de cadastro novo: `AceitouTermos` (bool antigo) fica como está,
não precisa migrar dado histórico — a partir do deploy, toda professora (nova ou
antiga) passa pelo novo gate no próximo acesso independentemente desse campo antigo.

## Texto do primeiro termo (seed)

Genérico, redigido para esta entrega — chave `uso_ferramenta`, `Versao = 1`:

> **Termos de Uso da Ferramenta**
>
> Ao utilizar a Plural Plataforma, você concorda com os seguintes termos:
>
> 1. **Uso da ferramenta**: a Plural Plataforma é destinada ao uso pedagógico por
>    profissionais da educação para apoio ao planejamento, acompanhamento e produção de
>    documentos relacionados ao atendimento educacional de alunos.
> 2. **Dados tratados**: você é responsável pela veracidade e adequação dos dados
>    inseridos na plataforma, incluindo dados de alunos sob sua responsabilidade
>    pedagógica. Evite inserir informações pessoais ou de saúde que não sejam
>    necessárias para a finalidade pedagógica de cada registro.
>    A Plural Plataforma trata os dados conforme a Lei Geral de Proteção de Dados
>    (LGPD — Lei nº 13.709/2018).
> 3. **Inteligência Artificial**: alguns recursos da plataforma utilizam ferramentas de
>    inteligência artificial para apoiar a geração de documentos e sugestões
>    pedagógicas. O conteúdo gerado deve ser revisado por você antes do uso.
> 4. **Conta e acesso**: você é responsável por manter a confidencialidade de sua senha
>    e por todas as atividades realizadas em sua conta.
> 5. **Atualizações destes termos**: novos termos ou versões atualizadas poderão ser
>    publicados conforme a evolução da plataforma. Você será notificada e precisará
>    aceitar as novas versões para continuar utilizando a ferramenta.
> 6. **Direitos da titular**: você pode solicitar informações sobre os dados tratados
>    pela plataforma através do nosso canal de suporte.
>
> Ao clicar em "Aceitar e continuar", você declara ter lido e concordado com estes
> termos.

## Testes

- Backend: `TermoService` — pendência calculada corretamente (usuário sem aceite,
  usuário com aceite de versão antiga, usuário com aceite da versão atual); aceite
  idempotente.
- web-app: `ProtectedRoute` redireciona para `/aceitar-termos` quando há pendência;
  não redireciona quando lista vazia; libera navegação após aceitar.
- mobile: equivalente ao teste acima adaptado ao layout raiz.

## Fora de escopo desta entrega

- Tela de admin para gerenciar termos (CRUD) — versões novas via migration/seed.
- Gate para Admin/Embaixadora.
- Opção de aceite parcial ou "adiar".
- Exportação/relatório de aceites para auditoria (dado já fica no banco, relatório fica
  para quando for pedido).
