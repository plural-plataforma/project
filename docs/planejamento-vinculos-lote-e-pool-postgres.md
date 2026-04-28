# Planejamento: vínculos em lote e limite de pool PostgreSQL

Documento de referência para replicar ou portar estes ajustes quando o novo backend (em stash) for integrado.

## Problema

- Ao criar um **PAEE** com muitos alunos, habilidades, estratégias e critérios, o **web-app** disparava dezenas de `POST` em **paralelo** (`Promise.all`).
- O PostgreSQL (ex.: Supabase com `max_connections` baixo, ex. 60) retornava **`XX000: Max client connections reached`**, resultando em **500** nos endpoints `vincularhabilidade`, `vincularestrategia`, `vincularavaliacao`, etc.
- O Npgsql, sem teto explícito, podia competir com o limite global do banco por instância da API.

## Ajustes realizados (backend atual — `apps/api`)

### 1. Limite de pool por instância

- **Arquivos:** `Program.cs`, `appsettings.json` (seção `Database:MaxPoolSize`).
- **Comportamento:** após montar a connection string, anexa `Maximum Pool Size=<N>` (Npgsql).
- **Configuração:** `Database:MaxPoolSize` (padrão 20) ou variável de ambiente `Database__MaxPoolSize`.
- **Regra:** `instâncias da API × N + outros clientes < max_connections` do Postgres (com margem).

### 2. Endpoints em lote (novos)

Rotas POST sob `api/Planejamento/` (mesmo controller e autorização dos demais):

| Rota | Corpo (JSON camelCase) | Observação |
|------|------------------------|------------|
| `vincularalunoslote` | `{ idPlanejamento, idAlunos: number[] }` | Lista obrigatória com pelo menos 1 aluno (validação DTO). |
| `vincularhabilidadeslote` | `{ idPlanejamento, idHabilidades: number[] }` | Lista vazia = sucesso sem alteração. |
| `vincularestrategiaslote` | `{ idPlanejamento, idEstrategias: number[] }` | Idem. |
| `vincularavaliacoeslote` | `{ idPlanejamento, idAvaliacoes: number[] }` | Idem. |

**DTOs:** `apps/api/DTOs/Planejamento/PlanejamentoVincular*LoteDTO.cs`

**Serviço:** `PlanejamentoService` — métodos `VincularAlunosEmLote`, `VincularHabilidadesEmLote`, `VincularEstrategiasEmLote`, `VincularAvaliacoesEmLote`:

- Validam se o planejamento pertence ao professor (`IdProfessor`).
- Validam se todos os IDs informados existem e pertencem à regra de negócio (alunos do professor; demais entidades existentes).
- **Vínculos já existentes são ignorados** (idempotente), ao contrário do endpoint unitário que falha com “já vinculado”.
- **Um `SaveChangesAsync` por requisição.**

**Endpoints unitários originais** (`vincularaluno`, `vincularhabilidade`, etc.) foram **mantidos** para compatibilidade (ex.: tela de detalhe que vincula um item por clique).

## Ajustes no web-app (`apps/web-app`)

- **`planejamentoService.ts`:** funções `vincularAlunosPlanoLote`, `vincularHabilidadesPlanoLote`, `vincularEstrategiasPlanoLote`, `vincularAvaliacoesPlanoLote`.
- **`PlanejamentosPage.tsx`:** após `cadastrarPlanejamento`, chama os quatro lote **em sequência** (não `Promise.all` entre tipos), reduzindo pico de conexões.
- Testes: `planejamentoService.test.ts` (ex.: `vincularAlunosPlanoLote`).

## Ajustes no mobile (`apps/mobile`)

- **`planejamentoService.ts`:** mesmas rotas de lote; correção da URL de `vincularAvaliacao` para `/Planejamento/vincularavaliacao`.
- **`PlanejamentoScreen.tsx`:** `vincularNovos` passou a uma **única chamada por tipo** com lista de IDs, em vez de `Promise.all` por item.

## Checklist para o novo backend (stash)

- [ ] Definir **teto de conexão** no cliente SQL (pool) compatível com `max_connections` do Postgres.
- [ ] Expor as **quatro rotas em lote** com o **mesmo contrato JSON** (nomes de propriedades camelCase) ou atualizar os clients com o novo contrato de forma coordenada.
- [ ] Replicar regras: dono do planejamento (professor), existência das entidades, comportamento **idempotente** para vínculos duplicados no lote (ou alinhar com produto se preferir falhar).
- [ ] Manter ou substituir endpoints **unitários** conforme uso nas telas (detalhe x criação em massa).
- [ ] Após deploy da API, deploy do **web-app** e release do **mobile** que consomem os lote (ordem: API primeiro ou junto).

## Referência rápida de arquivos tocados (monorepo atual)

- `apps/api/Program.cs`, `apps/api/appsettings.json`
- `apps/api/Controllers/PlanejamentoController.cs`
- `apps/api/Services/PlanejamentoService.cs`
- `apps/api/DTOs/Planejamento/PlanejamentoVincular*LoteDTO.cs`
- `apps/web-app/src/services/planejamentoService.ts`, `PlanejamentosPage.tsx`, `planejamentoService.test.ts`
- `apps/mobile/src/services/planejamentoService.ts`, `app/planejamento/PlanejamentoScreen.tsx`
