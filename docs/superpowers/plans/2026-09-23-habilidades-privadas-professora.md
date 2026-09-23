# Habilidades privadas da professora — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permitir que a professora crie habilidades próprias, usadas no PAEE dela e visíveis somente para ela.

**Architecture:** Coluna nullable `IdProfessor` em `habilidades` (`null` = catálogo global). O backend filtra a visibilidade em um único predicado reutilizável (`VisiveisParaProfessor`) aplicado em `Buscar` e em todos os pontos que aceitam ID de habilidade. No web-app, um `HabilidadeFormDialog` novo é aberto de dentro dos dois seletores de habilidade (modal de vínculo do PAEE e passo do wizard).

**Tech Stack:** .NET / EF Core (Npgsql) em `apps/api`; React + Vite + TypeScript, react-query, react-hook-form + zod, vitest em `apps/web-app`.

**Spec:** `docs/superpowers/specs/2026-09-23-habilidades-privadas-professora-design.md`

## Global Constraints

- Seguir o padrão existente do projeto; sem novas bibliotecas nem arquiteturas.
- **Não executar** git (`add`/`commit`/`push`/branch), testes, build, lint, `dotnet`, `npm` ou servidores. Cada task termina listando arquivos alterados + mensagem de commit sugerida; a usuária roda os comandos de verificação e versiona.
- Testes backend C# ficam **fora** (adiados por decisão). A verificação backend é a checklist manual do fim do plano.
- Comentários só para lógica complexa ou decisão arquitetural. Nomes claros, sem abreviações.
- Textos de UI e mensagens de API em pt-BR com acentuação correta.
- `Tipo` é texto livre obrigatório. "Desativar" = `Ativo = false`; vínculos existentes permanecem.
- Habilidades existentes ficam `IdProfessor = null` (globais). Sem backfill.
- Admin cria globais e vê tudo; Professor vê globais + próprias e só edita as próprias.
- Visibilidade é imposta no backend; o frontend só reflete.
- `NIVEL_ENSINO_MAP` vai para `apps/web-app/src/config/nivelEnsino.ts` (pasta `config/` já existe).

## Review Focus

Casos que o spec implica mas nenhuma task exercita com teste C# (adiado); cada um tem verificação na task indicada e na checklist final:

1. Usuária com role `Professor` mas `ProfessorId == null` não pode cadastrar nem editar (e não pode "ser dona" das globais pela comparação `null == null`) — Task 2.
2. Professora B vincula por ID a habilidade privada da A (vínculo simples, em lote e em encontros) — deve responder "não encontrada" — Task 3.
3. Habilidade desativada que já está num PAEE continua aparecendo e exportando nesse PAEE; some só do seletor — Tasks 6 e 7 (filtro `ativo !== false` só nas listas de seleção) e checklist.
4. `PUT api/atividades/{id}/habilidades` (sem `[Authorize]` aparente) não pode anexar habilidade privada a atividade do catálogo — Task 3.
5. Descrição/tipo só com espaços: rejeitar no cliente (teste na Task 5) e no servidor (Task 2).

---

## File Structure

**Backend (`apps/api`)**

| Arquivo | Ação | Responsabilidade |
|---|---|---|
| `Models/Habilidade.cs` | Modificar | Campo `IdProfessor` + navegação `Professor` |
| `Data/AppDbContext.cs` | Modificar | FK opcional Habilidade→Professor, índice |
| `Helpers/HabilidadeVisibilidadeExtensions.cs` | Criar | Predicado único `VisiveisParaProfessor` |
| `DTOs/Habilidade/HabilidadeBuscarDTO.cs` | Modificar | Campo `EhPropria` |
| `DTOs/Habilidade/HabilidadeCadastroDTO.cs` | Modificar | Tira `[Required]` de `Id` |
| `Services/HabilidadeService.cs` | Reescrever | Buscar/Cadastro/Atualizar cientes do usuário |
| `Controllers/HabilidadeController.cs` | Reescrever | Repassa usuário logado |
| `Services/PlanejamentoService.cs` | Modificar | 3 pontos aplicam o predicado |
| `Services/AtividadeService.cs` | Modificar | Sync só de habilidades globais |
| `Migrations/*_HabilidadeIdProfessor*` | Gerar (usuária) | Migration EF |
| `docs/migrations-pendentes/2026-09-23-habilidade-id-professor.md` | Criar | Roteiro da migration |

**Frontend (`apps/web-app/src`)**

| Arquivo | Ação | Responsabilidade |
|---|---|---|
| `config/nivelEnsino.ts` | Criar | `NIVEL_ENSINO_MAP` compartilhado |
| `types/habilidade.ts` | Modificar | `ativo`, `ehPropria`, payloads |
| `services/habilidadeService.ts` | Modificar | `criarHabilidade`, `atualizarHabilidade` |
| `services/habilidadeService.test.ts` | Modificar | Testes dos novos métodos |
| `pages/planejamento/HabilidadeFormDialog.tsx` | Criar | Form criar/editar |
| `pages/planejamento/HabilidadeFormDialog.test.tsx` | Criar | Testes do form |
| `pages/planejamento/PlanejamentoDetailPage.tsx` | Modificar | Botão, badge, editar/desativar, vínculo automático |
| `pages/planejamento/PlanejamentosPage.tsx` | Modificar | Idem no wizard |

---

### Task 1: Modelo, migration e predicado de visibilidade

**Files:**
- Modify: `apps/api/Models/Habilidade.cs`
- Modify: `apps/api/Data/AppDbContext.cs` (após o bloco `HabilidadesXPlanejamento`, ~linha 119)
- Create: `apps/api/Helpers/HabilidadeVisibilidadeExtensions.cs`
- Create: `docs/migrations-pendentes/2026-09-23-habilidade-id-professor.md`
- Generate (usuária): `apps/api/Migrations/<timestamp>_HabilidadeIdProfessor.cs` + `.Designer.cs` + snapshot

**Interfaces:**
- Produces: `Habilidade.IdProfessor : int?`, `Habilidade.Professor : Professor?`; `IQueryable<Habilidade>.VisiveisParaProfessor(int? professorId) : IQueryable<Habilidade>` (namespace `api.Helpers`).

- [ ] **Step 1: Adicionar campo no modelo**

Em `Models/Habilidade.cs`, logo após `public bool Ativo { get; set; }`:

```csharp
    /// <summary>Dona da habilidade. Nulo = catálogo global, visível a todas.</summary>
    public int? IdProfessor { get; set; }

    [ForeignKey("IdProfessor")]
    public Professor? Professor { get; set; }
```

- [ ] **Step 2: Configurar relacionamento e índice**

Em `Data/AppDbContext.cs`, logo após o bloco `// Planejamento ↔ Habilidade (N:N)` (depois de `.HasForeignKey(ph => ph.HabilidadeId);`):

```csharp
            // Habilidade privada da professora (IdProfessor nulo = catálogo global)
            modelBuilder.Entity<Habilidade>()
                .HasOne(h => h.Professor)
                .WithMany()
                .HasForeignKey(h => h.IdProfessor)
                .OnDelete(DeleteBehavior.Cascade)
                .IsRequired(false);

            modelBuilder.Entity<Habilidade>()
                .HasIndex(h => h.IdProfessor);
```

- [ ] **Step 3: Criar o predicado**

`Helpers/HabilidadeVisibilidadeExtensions.cs`:

```csharp
using api.Models;

namespace api.Helpers;

public static class HabilidadeVisibilidadeExtensions
{
    /// <summary>Habilidades globais (IdProfessor nulo) mais as próprias da professora.</summary>
    public static IQueryable<Habilidade> VisiveisParaProfessor(this IQueryable<Habilidade> consulta, int? professorId)
    {
        return consulta.Where(h => h.IdProfessor == null || h.IdProfessor == professorId);
    }
}
```

- [ ] **Step 4: Roteiro da migration**

Criar `docs/migrations-pendentes/2026-09-23-habilidade-id-professor.md` com este conteúdo:

````markdown
# Migration pendente: `IdProfessor` em `habilidades`

Habilidade privada da professora. Coluna nullable, sem backfill: registros atuais ficam globais.
A migration é aplicada no startup (`context.Database.Migrate()` em `Program.cs`) ao subir `staging`/`production`.

## Gerar

```bash
cd apps/api
dotnet ef migrations add HabilidadeIdProfessor
```

## Conferir o arquivo gerado (`Up`)

Deve conter apenas, na tabela `habilidades`:

1. `AddColumn<int>` `idprofessor` (nullable)
2. `CreateIndex` em `idprofessor`
3. `AddForeignKey` para `professores` (`OnDelete: Cascade`)

Qualquer `DropColumn`/`RenameColumn` fora disso indica diff de outro modelo pendente: parar e revisar antes de aplicar.

## Ordem de deploy

Backend antes do frontend. Frontend antigo ignora `ehPropria`; frontend novo depende dele.
````

- [ ] **Step 5: Verificação (usuária)**

```bash
cd apps/api && dotnet build
dotnet ef migrations add HabilidadeIdProfessor
```
Esperado: build ok; migration gerada conforme o Step 4.

- [ ] **Step 6: Registrar** — Arquivos: `Models/Habilidade.cs`, `Data/AppDbContext.cs`, `Helpers/HabilidadeVisibilidadeExtensions.cs`, `Migrations/*HabilidadeIdProfessor*`, `docs/migrations-pendentes/2026-09-23-habilidade-id-professor.md`. Mensagem sugerida: `feat(api): adiciona IdProfessor em habilidades e predicado de visibilidade`.

---

### Task 2: HabilidadeService, DTOs e Controller cientes do usuário

**Files:**
- Modify: `apps/api/DTOs/Habilidade/HabilidadeBuscarDTO.cs`
- Modify: `apps/api/DTOs/Habilidade/HabilidadeCadastroDTO.cs`
- Rewrite: `apps/api/Services/HabilidadeService.cs`
- Rewrite: `apps/api/Controllers/HabilidadeController.cs`

**Interfaces:**
- Consumes: `VisiveisParaProfessor` (Task 1).
- Produces:
  - `HabilidadeBuscarDTO.EhPropria : bool`
  - `Task<ServiceResponse<List<HabilidadeBuscarDTO>>> Buscar(Usuario usuario)`
  - `Task<ServiceResponse<HabilidadeBuscarDTO>> Cadastro(HabilidadeCadastroDTO dto, Usuario usuario)` — devolve a habilidade criada em `Objeto`
  - `Task<ServiceResponse<HabilidadeAtualizarDTO>> Atualizar(HabilidadeAtualizarDTO dto, Usuario usuario)`

- [ ] **Step 1: DTO de busca**

Em `HabilidadeBuscarDTO.cs`, após a propriedade `Ativo`:

```csharp
        public bool EhPropria { get; set; }
```

- [ ] **Step 2: DTO de cadastro**

Em `HabilidadeCadastroDTO.cs`, remover o `[Required]` que precede `public int Id { get; set; }` (o campo continua existindo e é ignorado; evita quebrar o admin `apps/web`). Resultado:

```csharp
        public int Id { get; set; }

        [Required]
        public int IdNivelEnsino { get; set; }
```

- [ ] **Step 3: Reescrever o service**

`Services/HabilidadeService.cs` completo:

```csharp
using api.DTOs;
using api.DTOs.Habilidade;
using api.Helpers;
using api.Models;
using api.Responses;
using Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace api.Services
{
    public class HabilidadeService
    {
        private readonly AppDbContext _contexto;
        private readonly UserManager<Usuario> _usuario;

        public HabilidadeService(AppDbContext contexto, UserManager<Usuario> usuario)
        {
            _contexto = contexto;
            _usuario = usuario;
        }

        public async Task<ServiceResponse<HabilidadeBuscarDTO>> Cadastro(HabilidadeCadastroDTO habilidadeDTO, Usuario usuario)
        {
            var resposta = new ServiceResponse<HabilidadeBuscarDTO>();

            if (string.IsNullOrWhiteSpace(habilidadeDTO.Tipo) || string.IsNullOrWhiteSpace(habilidadeDTO.Descricao))
            {
                resposta.SetFalha("Tipo e descrição são obrigatórios.");
                return resposta;
            }

            var ehAdmin = await _usuario.IsInRoleAsync(usuario, "Admin");
            if (!ehAdmin && usuario.ProfessorId == null)
            {
                resposta.SetFalha("Professor não identificado.");
                return resposta;
            }

            using (var transacao = await _contexto.Database.BeginTransactionAsync())
            {
                try
                {
                    Habilidade habilidade = new Habilidade()
                    {
                        IdNivelEnsino = habilidadeDTO.IdNivelEnsino,
                        Tipo = habilidadeDTO.Tipo.Trim(),
                        Descricao = habilidadeDTO.Descricao.Trim(),
                        Resumo = string.IsNullOrWhiteSpace(habilidadeDTO.Resumo) ? "" : habilidadeDTO.Resumo.Trim(),
                        Ativo = true,
                        IdProfessor = ehAdmin ? null : usuario.ProfessorId
                    };
                    _contexto.Habilidades.Add(habilidade);
                    await _contexto.SaveChangesAsync();

                    await transacao.CommitAsync();
                    resposta.Sucesso = true;
                    resposta.AdicionaObjeto(MapearParaDTO(habilidade));
                    resposta.AdicionaMensagem("Cadastro de habilidade realizado com sucesso.");
                    return resposta;
                }
                catch (Exception)
                {
                    await transacao.RollbackAsync();
                    resposta.SetFalha("Erro ao cadastrar habilidade.");
                    throw;
                }
            }
        }

        public async Task<ServiceResponse<HabilidadeAtualizarDTO>> Atualizar(HabilidadeAtualizarDTO habilidadeDTO, Usuario usuario)
        {
            var resposta = new ServiceResponse<HabilidadeAtualizarDTO>();

            try
            {
                var ehAdmin = await _usuario.IsInRoleAsync(usuario, "Admin");
                if (!ehAdmin && usuario.ProfessorId == null)
                {
                    resposta.SetFalha("Professor não identificado.");
                    return resposta;
                }

                // Professora só altera as próprias; comparar com IdProfessor não nulo evita casar com globais.
                var professorId = usuario.ProfessorId;
                Habilidade? habilidade = await _contexto.Habilidades.FirstOrDefaultAsync(h =>
                    h.Id == habilidadeDTO.Id &&
                    (ehAdmin || (h.IdProfessor != null && h.IdProfessor == professorId)));
                if (habilidade == null)
                {
                    resposta.SetFalha("Habilidade não encontrada.");
                    return resposta;
                }

                if (habilidadeDTO.IdNivelEnsino.HasValue && habilidadeDTO.IdNivelEnsino != 0)
                {
                    habilidade.IdNivelEnsino = (int)habilidadeDTO.IdNivelEnsino;
                }

                if (!string.IsNullOrWhiteSpace(habilidadeDTO.Tipo))
                {
                    habilidade.Tipo = habilidadeDTO.Tipo.Trim();
                }

                if (!string.IsNullOrWhiteSpace(habilidadeDTO.Descricao))
                {
                    habilidade.Descricao = habilidadeDTO.Descricao.Trim();
                }

                if (!string.IsNullOrEmpty(habilidadeDTO.Resumo))
                {
                    habilidade.Resumo = habilidadeDTO.Resumo.Trim();
                }

                if (habilidadeDTO.Ativo.HasValue)
                {
                    habilidade.Ativo = (bool)habilidadeDTO.Ativo;
                }

                await _contexto.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                resposta.SetFalha(ex.Message);
                return resposta;
            }

            resposta.AdicionaMensagem("Atualização de habilidade realizada com sucesso.");
            return resposta;
        }

        public async Task<ServiceResponse<List<HabilidadeBuscarDTO>>> Buscar(Usuario usuario)
        {
            var resposta = new ServiceResponse<List<HabilidadeBuscarDTO>>();
            try
            {
                var ehAdmin = await _usuario.IsInRoleAsync(usuario, "Admin");
                IQueryable<Habilidade> consulta = _contexto.Habilidades.AsNoTracking();
                if (!ehAdmin)
                {
                    consulta = consulta.VisiveisParaProfessor(usuario.ProfessorId);
                }

                var habilidades = await consulta
                    .Select(h => new HabilidadeBuscarDTO
                    {
                        Id = h.Id,
                        IdNivelEnsino = h.IdNivelEnsino,
                        Tipo = h.Tipo,
                        Descricao = h.Descricao,
                        Resumo = h.Resumo,
                        Ativo = h.Ativo,
                        EhPropria = h.IdProfessor != null
                    })
                    .ToListAsync();
                resposta.AdicionaObjeto(habilidades);
                resposta.Sucesso = true;
                return resposta;
            }
            catch (Exception)
            {
                resposta.SetFalha("Erro ao buscar habilidades.");
                return resposta;
            }
        }

        private static HabilidadeBuscarDTO MapearParaDTO(Habilidade habilidade)
        {
            return new HabilidadeBuscarDTO
            {
                Id = habilidade.Id,
                IdNivelEnsino = habilidade.IdNivelEnsino,
                Tipo = habilidade.Tipo,
                Descricao = habilidade.Descricao,
                Resumo = habilidade.Resumo,
                Ativo = habilidade.Ativo,
                EhPropria = habilidade.IdProfessor != null
            };
        }
    }
}
```

- [ ] **Step 4: Reescrever o controller**

`Controllers/HabilidadeController.cs` completo:

```csharp
using api.DTOs;
using api.DTOs.Habilidade;
using api.Models;
using api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace api.Controllers
{
    [Authorize(Roles = "Professor, Admin")]
    [ApiController]
    [Route("api/[controller]")]
    public class HabilidadeController : ControllerBase
    {
        private readonly HabilidadeService _habilidadeService;
        private readonly UserManager<Usuario> _usuario;

        public HabilidadeController(HabilidadeService habilidadeService, UserManager<Usuario> usuario)
        {
            _habilidadeService = habilidadeService;
            _usuario = usuario;
        }

        [HttpPost("cadastro")]
        public async Task<IActionResult> Cadastro([FromBody] HabilidadeCadastroDTO habilidadeDTO)
        {
            if (ModelState.IsValid)
            {
                var usuario = await _usuario.GetUserAsync(User);
                if (usuario == null)
                {
                    return Unauthorized();
                }

                var resposta = await _habilidadeService.Cadastro(habilidadeDTO, usuario);
                if (resposta.Sucesso)
                {
                    return Ok(resposta);
                }
                else
                {
                    return BadRequest(resposta);
                }
            }
            else
            {
                return BadRequest(ModelState);
            }
        }

        [HttpPatch("atualizar")]
        public async Task<IActionResult> Atualizar([FromBody] HabilidadeAtualizarDTO habilidadeDTO)
        {
            if (ModelState.IsValid)
            {
                var usuario = await _usuario.GetUserAsync(User);
                if (usuario == null)
                {
                    return Unauthorized();
                }

                var resposta = await _habilidadeService.Atualizar(habilidadeDTO, usuario);
                if (resposta.Sucesso)
                {
                    return Ok(resposta);
                }
                else
                {
                    return BadRequest(resposta);
                }
            }
            else
            {
                return BadRequest(ModelState);
            }
        }

        [HttpGet("buscar")]
        public async Task<IActionResult> Buscar()
        {
            var usuario = await _usuario.GetUserAsync(User);
            if (usuario == null)
            {
                return Unauthorized();
            }

            var resposta = await _habilidadeService.Buscar(usuario);
            if (resposta.Sucesso)
            {
                return Ok(resposta);
            }
            else
            {
                return BadRequest(resposta);
            }
        }
    }
}
```

- [ ] **Step 5: Verificação (usuária)**

```bash
cd apps/api && dotnet build
```
Esperado: build ok. Se `apps/web` ou outro projeto chamar `HabilidadeService.Buscar()/Cadastro()/Atualizar()` sem usuário, o build acusa; corrigir o chamador passando o usuário logado.

Verificação manual (Review Focus 1): usuária com role `Professor` e `ProfessorId` nulo recebe "Professor não identificado." em cadastro e atualizar.

- [ ] **Step 6: Registrar** — Arquivos: `DTOs/Habilidade/HabilidadeBuscarDTO.cs`, `DTOs/Habilidade/HabilidadeCadastroDTO.cs`, `Services/HabilidadeService.cs`, `Controllers/HabilidadeController.cs`. Mensagem: `feat(api): habilidades filtradas por dono e cadastro devolve objeto criado`.

---

### Task 3: Bloquear uso de habilidade privada alheia nos vínculos

**Files:**
- Modify: `apps/api/Services/PlanejamentoService.cs` (`VincularHabilidade` ~785, `VincularHabilidadesEmLote` ~1025, `SubstituirEncontros` ~554)
- Modify: `apps/api/Services/AtividadeService.cs` (`SyncHabilidades` ~365)

**Interfaces:**
- Consumes: `VisiveisParaProfessor(int? professorId)` (Task 1).

- [ ] **Step 1: Garantir o using**

No topo de `PlanejamentoService.cs` e `AtividadeService.cs`, adicionar `using api.Helpers;` se ainda não existir.

- [ ] **Step 2: `VincularHabilidade`**

Substituir:

```csharp
            var habilidade = await _contexto.Habilidades
                .FirstOrDefaultAsync(a =>
                    a.Id == planejamentoVincularHabilidadeDTO.IdHabilidade);
```

por:

```csharp
            var habilidade = await _contexto.Habilidades
                .VisiveisParaProfessor(usuario.ProfessorId)
                .FirstOrDefaultAsync(a =>
                    a.Id == planejamentoVincularHabilidadeDTO.IdHabilidade);
```

- [ ] **Step 3: `VincularHabilidadesEmLote`**

Substituir:

```csharp
            var encontradas = await _contexto.Habilidades
                .Where(h => distinctIds.Contains(h.Id))
```

por:

```csharp
            var encontradas = await _contexto.Habilidades
                .VisiveisParaProfessor(usuario.ProfessorId)
                .Where(h => distinctIds.Contains(h.Id))
```

- [ ] **Step 4: `SubstituirEncontros`**

Substituir:

```csharp
                    var countH = await _contexto.Habilidades.CountAsync(h => habIdsComChave.Contains(h.Id));
```

por:

```csharp
                    var countH = await _contexto.Habilidades
                        .VisiveisParaProfessor(professorId)
                        .CountAsync(h => habIdsComChave.Contains(h.Id));
```

(`professorId` já existe no escopo: `var professorId = (int)usuario.ProfessorId!;`.)

- [ ] **Step 5: `AtividadeService.SyncHabilidades`**

Atividades pertencem ao catálogo e são lidas por qualquer usuária; habilidade privada nunca pode ser anexada a elas. Substituir:

```csharp
                var habilidades = await _contexto.Habilidades
                    .Where(h => habilidadeIds.Contains(h.Id))
                    .ToListAsync();
```

por:

```csharp
                // Atividade é do catálogo: só habilidades globais, para não vazar habilidade privada.
                var habilidades = await _contexto.Habilidades
                    .Where(h => habilidadeIds.Contains(h.Id) && h.IdProfessor == null)
                    .ToListAsync();
```

- [ ] **Step 6: Verificação (usuária)**

```bash
cd apps/api && dotnet build
```
Manual (Review Focus 2 e 4), com duas professoras A e B:
- A cria habilidade privada `X`. B chama `POST /api/Planejamento/vincularhabilidade` com o ID de `X` → `"Habilidade não encontrada."`; idem `vincularhabilidadeslote` → `"Uma ou mais habilidades não foram encontradas."`; idem substituir encontros com `habilidadeId = X` → `"Uma ou mais habilidades informadas não existem."`.
- `PUT /api/atividades/{id}/habilidades` com o ID de `X` não anexa `X` à atividade.

- [ ] **Step 7: Registrar** — Arquivos: `Services/PlanejamentoService.cs`, `Services/AtividadeService.cs`. Mensagem: `fix(api): impede vincular habilidade privada de outra professora`.

> **Achado fora de escopo:** `AtividadesController` não tem `[Authorize]` no `PUT {id}/habilidades` (nem em outras ações). Confirmar se há política global; se não houver, é endpoint aberto. Não alterado aqui.

---

### Task 4: Config, tipos e serviço do web-app

**Files:**
- Create: `apps/web-app/src/config/nivelEnsino.ts`
- Modify: `apps/web-app/src/types/habilidade.ts`
- Modify: `apps/web-app/src/services/habilidadeService.ts`
- Modify: `apps/web-app/src/services/habilidadeService.test.ts`
- Modify: `apps/web-app/src/pages/planejamento/PlanejamentoDetailPage.tsx` e `PlanejamentosPage.tsx` (apenas trocar a constante local pelo import)

**Interfaces:**
- Produces:
  - `NIVEL_ENSINO_MAP: Record<number, string>` (`@/config/nivelEnsino`)
  - `Habilidade` com `ativo?: boolean`, `ehPropria?: boolean`
  - `HabilidadeCadastroPayload`, `HabilidadeAtualizarPayload`
  - `criarHabilidade(payload: HabilidadeCadastroPayload): Promise<Habilidade>`
  - `atualizarHabilidade(payload: HabilidadeAtualizarPayload): Promise<void>`

- [ ] **Step 1: Constante compartilhada**

`config/nivelEnsino.ts`:

```ts
export const NIVEL_ENSINO_MAP: Record<number, string> = {
  1: 'Ed. Infantil',
  2: 'Fundamental I',
  3: 'Fundamental II',
  4: 'Ensino Médio',
}
```

Em `PlanejamentoDetailPage.tsx` e `PlanejamentosPage.tsx`: apagar o `const NIVEL_ENSINO_MAP ... = { ... }` local e adicionar `import { NIVEL_ENSINO_MAP } from '@/config/nivelEnsino'` junto aos demais imports.

- [ ] **Step 2: Tipos**

`types/habilidade.ts` completo:

```ts
export interface Habilidade {
  id: number
  idNivelEnsino?: number
  tipo?: string
  descricao?: string
  resumo?: string
  ativo?: boolean
  ehPropria?: boolean
}

export interface HabilidadeResponse {
  sucesso: boolean
  mensagens: string[]
  objeto: Habilidade[]
}

export interface HabilidadeUnicaResponse {
  sucesso: boolean
  mensagens: string[]
  objeto: Habilidade | null
}

export interface HabilidadeCadastroPayload {
  idNivelEnsino: number
  tipo: string
  descricao: string
  resumo?: string
}

export interface HabilidadeAtualizarPayload {
  id: number
  idNivelEnsino?: number
  tipo?: string
  descricao?: string
  resumo?: string
  ativo?: boolean
}
```

- [ ] **Step 3: Escrever testes que falham**

Em `services/habilidadeService.test.ts`, trocar o mock e o import e acrescentar os `describe`:

```ts
import { buscarHabilidades, criarHabilidade, atualizarHabilidade } from './habilidadeService'
import { api } from '@/api/http'

vi.mock('@/api/http', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}))
```

Dentro do `describe('habilidadeService', ...)`, após `describe('buscarHabilidades', ...)`:

```ts
  describe('criarHabilidade', () => {
    it('envia payload e devolve a habilidade criada', async () => {
      vi.mocked(api.post).mockResolvedValue({
        data: { sucesso: true, mensagens: [], objeto: { id: 9, descricao: 'Nova', ehPropria: true } },
      })

      const result = await criarHabilidade({ idNivelEnsino: 2, tipo: 'Habilidade', descricao: 'Nova' })

      expect(api.post).toHaveBeenCalledWith('/Habilidade/cadastro', {
        idNivelEnsino: 2,
        tipo: 'Habilidade',
        descricao: 'Nova',
      })
      expect(result.id).toBe(9)
      expect(result.ehPropria).toBe(true)
    })

    it('lança erro com as mensagens quando sucesso é falso', async () => {
      vi.mocked(api.post).mockResolvedValue({
        data: { sucesso: false, mensagens: ['Tipo e descrição são obrigatórios.'], objeto: null },
      })

      await expect(
        criarHabilidade({ idNivelEnsino: 2, tipo: ' ', descricao: ' ' }),
      ).rejects.toThrow('Tipo e descrição são obrigatórios.')
    })
  })

  describe('atualizarHabilidade', () => {
    it('envia PATCH com o payload', async () => {
      vi.mocked(api.patch).mockResolvedValue({ data: { sucesso: true, mensagens: [] } })

      await atualizarHabilidade({ id: 3, ativo: false })

      expect(api.patch).toHaveBeenCalledWith('/Habilidade/atualizar', { id: 3, ativo: false })
    })

    it('lança erro quando sucesso é falso', async () => {
      vi.mocked(api.patch).mockResolvedValue({
        data: { sucesso: false, mensagens: ['Habilidade não encontrada.'] },
      })

      await expect(atualizarHabilidade({ id: 3, ativo: false })).rejects.toThrow('Habilidade não encontrada.')
    })
  })
```

- [ ] **Step 4: Rodar e ver falhar (usuária)**

```bash
cd apps/web-app && npx vitest run src/services/habilidadeService.test.ts
```
Esperado: FAIL (`criarHabilidade is not a function`).

- [ ] **Step 5: Implementar**

`services/habilidadeService.ts` completo:

```ts
import { api } from '@/api/http'
import type {
  Habilidade,
  HabilidadeAtualizarPayload,
  HabilidadeCadastroPayload,
  HabilidadeResponse,
  HabilidadeUnicaResponse,
} from '@/types/habilidade'

export const buscarHabilidades = async (): Promise<Habilidade[]> => {
  const response = await api.get<HabilidadeResponse>('/Habilidade/buscar')
  if (Array.isArray(response.data.objeto)) return response.data.objeto
  return []
}

export const criarHabilidade = async (payload: HabilidadeCadastroPayload): Promise<Habilidade> => {
  const response = await api.post<HabilidadeUnicaResponse>('/Habilidade/cadastro', payload)
  if (!response.data.sucesso || !response.data.objeto) {
    throw new Error(response.data.mensagens?.join(', ') || 'Falha ao criar habilidade')
  }
  return response.data.objeto
}

export const atualizarHabilidade = async (payload: HabilidadeAtualizarPayload): Promise<void> => {
  const response = await api.patch<{ sucesso: boolean; mensagens?: string[] }>('/Habilidade/atualizar', payload)
  if (!response.data.sucesso) {
    throw new Error(response.data.mensagens?.join(', ') || 'Falha ao atualizar habilidade')
  }
}
```

- [ ] **Step 6: Rodar e ver passar (usuária)**

```bash
cd apps/web-app && npx vitest run src/services/habilidadeService.test.ts && npm run typecheck
```
Esperado: PASS e typecheck sem erros (inclui a troca do `NIVEL_ENSINO_MAP`).

- [ ] **Step 7: Registrar** — Arquivos: `config/nivelEnsino.ts`, `types/habilidade.ts`, `services/habilidadeService.ts`, `services/habilidadeService.test.ts`, `pages/planejamento/PlanejamentoDetailPage.tsx`, `pages/planejamento/PlanejamentosPage.tsx`. Mensagem: `feat(web-app): serviço de habilidades próprias e constante de nível de ensino compartilhada`.

---

### Task 5: `HabilidadeFormDialog`

**Files:**
- Create: `apps/web-app/src/pages/planejamento/HabilidadeFormDialog.tsx`
- Create: `apps/web-app/src/pages/planejamento/HabilidadeFormDialog.test.tsx`

**Interfaces:**
- Consumes: `criarHabilidade`, `atualizarHabilidade`, `NIVEL_ENSINO_MAP`, `Habilidade` (Task 4).
- Produces: `HabilidadeFormDialog` com props
  `{ open: boolean; habilidade?: Habilidade | null; onClose: () => void; onSaved: (habilidade: Habilidade, criada: boolean) => void }`.
  Sem `habilidade` = modo criar; com `habilidade` = modo editar.

- [ ] **Step 1: Escrever testes que falham**

`HabilidadeFormDialog.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PageWrapper } from '@/test/page-test-utils'
import { HabilidadeFormDialog } from './HabilidadeFormDialog'
import { criarHabilidade, atualizarHabilidade } from '@/services/habilidadeService'

vi.mock('@/services/habilidadeService', () => ({
  criarHabilidade: vi.fn(),
  atualizarHabilidade: vi.fn(),
}))

function renderDialog(props: Partial<React.ComponentProps<typeof HabilidadeFormDialog>> = {}) {
  const onClose = vi.fn()
  const onSaved = vi.fn()
  render(
    <PageWrapper>
      <HabilidadeFormDialog open habilidade={null} onClose={onClose} onSaved={onSaved} {...props} />
    </PageWrapper>,
  )
  return { onClose, onSaved }
}

describe('HabilidadeFormDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('bloqueia envio com campos obrigatórios vazios ou só espaços', async () => {
    const user = userEvent.setup()
    renderDialog()

    await user.type(screen.getByLabelText(/^tipo/i), '   ')
    await user.type(screen.getByLabelText(/^descrição/i), '   ')
    await user.click(screen.getByRole('button', { name: /salvar/i }))

    expect(await screen.findByText('Nível de ensino obrigatório')).toBeInTheDocument()
    expect(screen.getByText('Tipo obrigatório')).toBeInTheDocument()
    expect(screen.getByText('Descrição obrigatória')).toBeInTheDocument()
    expect(criarHabilidade).not.toHaveBeenCalled()
  })

  it('cria habilidade e avisa onSaved com criada=true', async () => {
    const user = userEvent.setup()
    vi.mocked(criarHabilidade).mockResolvedValue({ id: 10, descricao: 'Ler', ehPropria: true })
    const { onSaved, onClose } = renderDialog()

    await user.selectOptions(screen.getByLabelText(/nível de ensino/i), '2')
    await user.type(screen.getByLabelText(/^tipo/i), ' Habilidade ')
    await user.type(screen.getByLabelText(/^descrição/i), 'Ler')
    await user.click(screen.getByRole('button', { name: /salvar/i }))

    await waitFor(() => expect(onSaved).toHaveBeenCalledWith({ id: 10, descricao: 'Ler', ehPropria: true }, true))
    expect(criarHabilidade).toHaveBeenCalledWith({
      idNivelEnsino: 2,
      tipo: 'Habilidade',
      descricao: 'Ler',
      resumo: undefined,
    })
    expect(onClose).toHaveBeenCalled()
  })

  it('edita habilidade existente e avisa onSaved com criada=false', async () => {
    const user = userEvent.setup()
    vi.mocked(atualizarHabilidade).mockResolvedValue(undefined)
    const existente = { id: 5, idNivelEnsino: 1, tipo: 'Habilidade', descricao: 'Antiga', ehPropria: true }
    const { onSaved } = renderDialog({ habilidade: existente })

    const descricao = screen.getByLabelText(/^descrição/i)
    await user.clear(descricao)
    await user.type(descricao, 'Nova')
    await user.click(screen.getByRole('button', { name: /salvar/i }))

    await waitFor(() => expect(atualizarHabilidade).toHaveBeenCalled())
    expect(atualizarHabilidade).toHaveBeenCalledWith(expect.objectContaining({ id: 5, descricao: 'Nova' }))
    expect(onSaved).toHaveBeenCalledWith(expect.objectContaining({ id: 5, descricao: 'Nova' }), false)
  })
})
```

- [ ] **Step 2: Rodar e ver falhar (usuária)**

```bash
cd apps/web-app && npx vitest run src/pages/planejamento/HabilidadeFormDialog.test.tsx
```
Esperado: FAIL (módulo não existe).

- [ ] **Step 3: Implementar**

`HabilidadeFormDialog.tsx`:

```tsx
import { useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { NIVEL_ENSINO_MAP } from '@/config/nivelEnsino'
import { atualizarHabilidade, criarHabilidade } from '@/services/habilidadeService'
import { useToast } from '@/hooks/useToast'
import { formatFriendlyErrorBody, getApiErrorFeedback } from '@/lib/apiFriendlyError'
import type { Habilidade } from '@/types/habilidade'

const schema = z.object({
  idNivelEnsino: z.string().min(1, 'Nível de ensino obrigatório'),
  tipo: z.string().trim().min(1, 'Tipo obrigatório'),
  descricao: z.string().trim().min(1, 'Descrição obrigatória'),
  resumo: z.string().optional(),
})

type FormData = z.infer<typeof schema>

const VALORES_VAZIOS: FormData = { idNivelEnsino: '', tipo: '', descricao: '', resumo: '' }

interface HabilidadeFormDialogProps {
  open: boolean
  habilidade?: Habilidade | null
  onClose: () => void
  onSaved: (habilidade: Habilidade, criada: boolean) => void
}

export function HabilidadeFormDialog({ open, habilidade, onClose, onSaved }: HabilidadeFormDialogProps) {
  const { success, error: showError } = useToast()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: VALORES_VAZIOS })

  useEffect(() => {
    if (!open) return
    reset(
      habilidade
        ? {
            idNivelEnsino: habilidade.idNivelEnsino ? String(habilidade.idNivelEnsino) : '',
            tipo: habilidade.tipo ?? '',
            descricao: habilidade.descricao ?? '',
            resumo: habilidade.resumo ?? '',
          }
        : VALORES_VAZIOS,
    )
  }, [open, habilidade, reset])

  const salvarMutation = useMutation({
    mutationFn: async (dados: FormData): Promise<{ salva: Habilidade; criada: boolean }> => {
      const payload = {
        idNivelEnsino: Number(dados.idNivelEnsino),
        tipo: dados.tipo.trim(),
        descricao: dados.descricao.trim(),
        resumo: dados.resumo?.trim() || undefined,
      }
      if (habilidade) {
        await atualizarHabilidade({ id: habilidade.id, ...payload })
        return { salva: { ...habilidade, ...payload, resumo: payload.resumo ?? habilidade.resumo }, criada: false }
      }
      return { salva: await criarHabilidade(payload), criada: true }
    },
    onSuccess: ({ salva, criada }) => {
      success(criada ? 'Habilidade criada!' : 'Habilidade atualizada!')
      onSaved(salva, criada)
      onClose()
    },
    onError: (err: unknown) => {
      const fb = getApiErrorFeedback(err)
      showError(fb.title, formatFriendlyErrorBody(fb))
    },
  })

  return (
    <Dialog open={open} onOpenChange={(aberto) => { if (!aberto) onClose() }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{habilidade ? 'Editar habilidade' : 'Nova habilidade'}</DialogTitle>
        </DialogHeader>

        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.stopPropagation()
            void handleSubmit((dados) => salvarMutation.mutate(dados))(e)
          }}
        >
          <div className="space-y-1">
            <label htmlFor="habilidade-nivel" className="text-sm font-medium text-foreground">
              Nível de ensino
            </label>
            <select
              id="habilidade-nivel"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              {...register('idNivelEnsino')}
            >
              <option value="">Selecione...</option>
              {Object.entries(NIVEL_ENSINO_MAP).map(([valor, rotulo]) => (
                <option key={valor} value={valor}>{rotulo}</option>
              ))}
            </select>
            {errors.idNivelEnsino && (
              <p className="text-xs text-danger">{errors.idNivelEnsino.message}</p>
            )}
          </div>

          <Input label="Tipo" error={errors.tipo?.message} {...register('tipo')} />
          <Input label="Descrição" error={errors.descricao?.message} {...register('descricao')} />

          <div className="space-y-1">
            <label htmlFor="habilidade-resumo" className="text-sm font-medium text-foreground">
              Resumo (opcional)
            </label>
            <textarea
              id="habilidade-resumo"
              rows={2}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              {...register('resumo')}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" size="sm" loading={salvarMutation.isPending}>
              Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
```

Notas: `e.stopPropagation()` impede o submit de borbulhar para um `<form>` ancestral (o wizard de `PlanejamentosPage` não usa `<form>` no passo, mas o dialog é portal e isso é defesa barata). Se `Input` renderizar asterisco/sufixo no label e quebrar `getByLabelText(/^tipo/i)`, ajustar o regex do teste, não o componente.

- [ ] **Step 4: Rodar e ver passar (usuária)**

```bash
cd apps/web-app && npx vitest run src/pages/planejamento/HabilidadeFormDialog.test.tsx && npm run typecheck && npm run lint
```
Esperado: 3 testes PASS, typecheck e lint ok.

- [ ] **Step 5: Registrar** — Arquivos: `pages/planejamento/HabilidadeFormDialog.tsx`, `pages/planejamento/HabilidadeFormDialog.test.tsx`. Mensagem: `feat(web-app): dialog para criar e editar habilidade própria`.

---

### Task 6: Integração no modal de vínculo do PAEE (`PlanejamentoDetailPage`)

**Files:**
- Modify: `apps/web-app/src/pages/planejamento/PlanejamentoDetailPage.tsx`

**Interfaces:**
- Consumes: `HabilidadeFormDialog` (Task 5), `atualizarHabilidade` (Task 4).

- [ ] **Step 1: Imports**

Ícones (linha 5-10): incluir `PencilSimple` e `EyeSlash`:

```tsx
import {
  Plus,
  X,
  MagnifyingGlass,
  DownloadSimple,
  PencilSimple,
  EyeSlash,
} from '@phosphor-icons/react'
```

Substituir `import { buscarHabilidades } from '@/services/habilidadeService'` por:

```tsx
import { atualizarHabilidade, buscarHabilidades } from '@/services/habilidadeService'
```

Adicionar:

```tsx
import { HabilidadeFormDialog } from './HabilidadeFormDialog'
import type { Habilidade } from '@/types/habilidade'
```

- [ ] **Step 2: Estado e mutation de desativar**

Junto aos `useState` do modal (perto de `const [vincModal, setVincModal] ...`):

```tsx
  const [habilidadeDialogAberto, setHabilidadeDialogAberto] = useState(false)
  const [habilidadeEmEdicao, setHabilidadeEmEdicao] = useState<Habilidade | null>(null)
```

Logo após `desvincularHabilidadeMutation`:

```tsx
  const desativarHabilidadeMutation = useMutation({
    mutationFn: (habilidadeId: number) => atualizarHabilidade({ id: habilidadeId, ativo: false }),
    onSuccess: () => {
      success('Habilidade desativada')
      qc.invalidateQueries({ queryKey: ['habilidades'] })
    },
    onError: (err: unknown) => {
      const fb = getApiErrorFeedback(err)
      showError(fb.title, formatFriendlyErrorBody(fb))
    },
  })

  function abrirNovaHabilidade() {
    setHabilidadeEmEdicao(null)
    setHabilidadeDialogAberto(true)
  }

  function abrirEdicaoHabilidade(habilidade: Habilidade) {
    setHabilidadeEmEdicao(habilidade)
    setHabilidadeDialogAberto(true)
  }

  async function aoSalvarHabilidade(habilidade: Habilidade, criada: boolean) {
    await qc.invalidateQueries({ queryKey: ['habilidades'] })
    if (criada) vincularMutation.mutate({ type: 'habilidades', itemId: habilidade.id })
  }
```

- [ ] **Step 3: Filtro só das listas de seleção**

Em `habsDisponiveis`, o `filter` passa a excluir desativadas (o PAEE continua mostrando as já vinculadas, pois `plan.habilidades` não passa por este filtro):

```tsx
    todasHabs.filter((h) => {
      const notVinc = !habsVinculadasIds.has(h.id)
      const ativa = h.ativo !== false
      const matchNivel = !filterNivel || String(h.idNivelEnsino) === filterNivel
      const matchSearch = !searchVinc || (h.descricao ?? '').toLowerCase().includes(searchVinc.toLowerCase())
      return notVinc && ativa && matchNivel && matchSearch
    }),
```

- [ ] **Step 4: Botão "Nova habilidade"**

No modal, imediatamente antes do `<div className="flex-1 overflow-y-auto space-y-1.5 pr-1">` da lista, adicionar:

```tsx
          {vincModal === 'habilidades' && (
            <Button variant="outline" size="sm" onClick={abrirNovaHabilidade}>
              <Plus size={14} /> Nova habilidade
            </Button>
          )}
```

- [ ] **Step 5: Linha de habilidade com badge e ações**

Substituir o bloco `{vincModal === 'habilidades' && habsDisponiveis.map((h) => ( ... ))}` por:

```tsx
            {vincModal === 'habilidades' && habsDisponiveis.map((h) => (
              <div key={h.id} className="flex items-stretch gap-1.5">
                <button
                  type="button"
                  onClick={() => vincularMutation.mutate({ type: 'habilidades', itemId: h.id })}
                  disabled={vincularMutation.isPending}
                  className="flex-1 flex items-start justify-between gap-2 px-3 py-2.5 rounded-lg border border-border hover:border-primary hover:bg-primary-light text-sm text-foreground text-left transition-colors disabled:opacity-50"
                >
                  <span className="flex-1 leading-snug">{h.descricao}</span>
                  <div className="flex items-center gap-1 shrink-0">
                    {h.ehPropria && <Badge variant="default" className="text-[10px]">Minha</Badge>}
                    {h.idNivelEnsino && <Badge variant="muted" className="text-[10px]">{NIVEL_ENSINO_MAP[h.idNivelEnsino]}</Badge>}
                    <Plus size={14} className="text-primary" />
                  </div>
                </button>
                {h.ehPropria && (
                  <div className="flex flex-col justify-center gap-1">
                    <button
                      type="button"
                      aria-label="Editar habilidade"
                      title="Editar habilidade"
                      onClick={() => abrirEdicaoHabilidade(h)}
                      className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-primary hover:border-primary transition-colors"
                    >
                      <PencilSimple size={14} />
                    </button>
                    <button
                      type="button"
                      aria-label="Desativar habilidade"
                      title="Desativar habilidade"
                      onClick={() => desativarHabilidadeMutation.mutate(h.id)}
                      disabled={desativarHabilidadeMutation.isPending}
                      className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-danger hover:border-danger transition-colors disabled:opacity-50"
                    >
                      <EyeSlash size={14} />
                    </button>
                  </div>
                )}
              </div>
            ))}
```

- [ ] **Step 6: Montar o dialog**

Logo após o `</Dialog>` do modal de vinculação (antes de `<PlanejamentoExcluirDialog`):

```tsx
      <HabilidadeFormDialog
        open={habilidadeDialogAberto}
        habilidade={habilidadeEmEdicao}
        onClose={() => setHabilidadeDialogAberto(false)}
        onSaved={(habilidade, criada) => void aoSalvarHabilidade(habilidade, criada)}
      />
```

- [ ] **Step 7: Verificação (usuária)**

```bash
cd apps/web-app && npm run typecheck && npm run lint && npx vitest run src/pages/planejamento/PlanejamentoDetailPage.test.tsx
```
Esperado: sem erros; teste existente da página continua passando.

- [ ] **Step 8: Registrar** — Arquivo: `pages/planejamento/PlanejamentoDetailPage.tsx`. Mensagem: `feat(web-app): criar, editar e desativar habilidade própria no vínculo do PAEE`.

---

### Task 7: Integração no wizard (`PlanejamentosPage`)

**Files:**
- Modify: `apps/web-app/src/pages/planejamento/PlanejamentosPage.tsx`

**Interfaces:**
- Consumes: `HabilidadeFormDialog` (Task 5), `atualizarHabilidade` (Task 4).

- [ ] **Step 1: Imports**

Ícones (linha 5): `import { Plus, BookOpen, MagnifyingGlass, CalendarBlank, Trash, PencilSimple, EyeSlash } from '@phosphor-icons/react'`.

Substituir `import { buscarHabilidades } from '@/services/habilidadeService'` por:

```tsx
import { atualizarHabilidade, buscarHabilidades } from '@/services/habilidadeService'
```

Adicionar `import { HabilidadeFormDialog } from './HabilidadeFormDialog'`.

- [ ] **Step 2: Estado, mutation e handlers**

Junto aos filtros locais (após `const [searchAvals, ...]`):

```tsx
  const [habilidadeDialogAberto, setHabilidadeDialogAberto] = useState(false)
  const [habilidadeEmEdicao, setHabilidadeEmEdicao] = useState<Habilidade | null>(null)
```

Após `createMutation` (usa `qc`, `success`, `showError` já existentes na página):

```tsx
  const desativarHabilidadeMutation = useMutation({
    mutationFn: (habilidadeId: number) => atualizarHabilidade({ id: habilidadeId, ativo: false }),
    onSuccess: (_data, habilidadeId) => {
      success('Habilidade desativada')
      setSelectedHabilidades((prev) => prev.filter((h) => h.id !== habilidadeId))
      qc.invalidateQueries({ queryKey: ['habilidades'] })
    },
    onError: (err: unknown) => {
      const fb = getApiErrorFeedback(err)
      showError(fb.title, formatFriendlyErrorBody(fb))
    },
  })

  function abrirNovaHabilidade() {
    setHabilidadeEmEdicao(null)
    setHabilidadeDialogAberto(true)
  }

  function abrirEdicaoHabilidade(habilidade: Habilidade) {
    setHabilidadeEmEdicao(habilidade)
    setHabilidadeDialogAberto(true)
  }

  async function aoSalvarHabilidade(habilidade: Habilidade, criada: boolean) {
    await qc.invalidateQueries({ queryKey: ['habilidades'] })
    if (criada) {
      setSelectedHabilidades((prev) => (prev.some((h) => h.id === habilidade.id) ? prev : [...prev, habilidade]))
    } else {
      setSelectedHabilidades((prev) => prev.map((h) => (h.id === habilidade.id ? habilidade : h)))
    }
  }
```

- [ ] **Step 3: Filtro**

Em `habsFiltradas`:

```tsx
    habilidades.filter((h) => {
      const ativa = h.ativo !== false
      const matchNivel = !filterNivel || String(h.idNivelEnsino) === filterNivel
      const matchSearch = !searchHabs || (h.descricao ?? '').toLowerCase().includes(searchHabs.toLowerCase())
      return ativa && matchNivel && matchSearch
    }),
```

- [ ] **Step 4: Botão e linhas no passo Habilidades**

No passo `step === 'habilidades'`, após o `<div className="flex gap-2">` de busca/nível e antes da lista `<div className="space-y-1.5 max-h-72 ...">`, inserir:

```tsx
                  <Button type="button" variant="outline" size="sm" onClick={abrirNovaHabilidade}>
                    <Plus size={14} /> Nova habilidade
                  </Button>
```

Substituir o `habsFiltradas.map((h) => { ... })` por:

```tsx
                    {habsFiltradas.map((h) => {
                      const sel = selectedHabilidades.some((s) => s.id === h.id)
                      return (
                        <div key={h.id} className="flex items-stretch gap-1.5">
                          <button
                            type="button"
                            onClick={() => toggleItem(h, selectedHabilidades, setSelectedHabilidades)}
                            className={`flex-1 flex items-start gap-2 px-3 py-2.5 rounded-lg border text-sm text-left transition-colors ${
                              sel ? 'border-primary bg-primary-light text-primary font-semibold' : 'border-border hover:bg-muted text-foreground'
                            }`}
                          >
                            <span className="flex-1 leading-snug">{h.descricao}</span>
                            {h.ehPropria && (
                              <Badge variant="default" className="shrink-0 text-[10px]">Minha</Badge>
                            )}
                            {h.idNivelEnsino && (
                              <Badge variant="muted" className="shrink-0 text-[10px]">
                                {NIVEL_ENSINO_MAP[h.idNivelEnsino] ?? h.idNivelEnsino}
                              </Badge>
                            )}
                          </button>
                          {h.ehPropria && (
                            <div className="flex flex-col justify-center gap-1">
                              <button
                                type="button"
                                aria-label="Editar habilidade"
                                title="Editar habilidade"
                                onClick={() => abrirEdicaoHabilidade(h)}
                                className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-primary hover:border-primary transition-colors"
                              >
                                <PencilSimple size={14} />
                              </button>
                              <button
                                type="button"
                                aria-label="Desativar habilidade"
                                title="Desativar habilidade"
                                onClick={() => desativarHabilidadeMutation.mutate(h.id)}
                                disabled={desativarHabilidadeMutation.isPending}
                                className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-danger hover:border-danger transition-colors disabled:opacity-50"
                              >
                                <EyeSlash size={14} />
                              </button>
                            </div>
                          )}
                        </div>
                      )
                    })}
```

- [ ] **Step 5: Montar o dialog**

Após o `</Dialog>` do wizard (antes de `<PlanejamentoExcluirDialog`):

```tsx
      <HabilidadeFormDialog
        open={habilidadeDialogAberto}
        habilidade={habilidadeEmEdicao}
        onClose={() => setHabilidadeDialogAberto(false)}
        onSaved={(habilidade, criada) => void aoSalvarHabilidade(habilidade, criada)}
      />
```

- [ ] **Step 6: Verificação (usuária)**

```bash
cd apps/web-app && npm run typecheck && npm run lint && npx vitest run src/pages/planejamento
```
Esperado: sem erros; testes de `PlanejamentosPage`, `PlanejamentoDetailPage` e `HabilidadeFormDialog` passam.

- [ ] **Step 7: Registrar** — Arquivo: `pages/planejamento/PlanejamentosPage.tsx`. Mensagem: `feat(web-app): criar, editar e desativar habilidade própria no wizard de PAEE`.

---

## Checklist manual final (usuária, dois usuários Professor A e B + um Admin)

1. Migration aplicada (`staging`); tabela `habilidades` com coluna `idprofessor`; linhas antigas com `NULL`.
2. A abre "Vincular habilidades" no PAEE → "Nova habilidade" → preenche → habilidade nasce **já vinculada** ao PAEE e aparece com badge "Minha" ao reabrir o modal (desvinculando antes, para ver na lista).
3. B não vê a habilidade de A em: modal de vínculo, wizard, `RelatosPage`, `AvaliacaoDesempenhoPage`.
4. B tenta vincular o ID da habilidade de A por request direto (vínculo simples, lote e encontros) → "não encontrada".
5. A edita e desativa a própria; globais não mostram lápis/olho. Desativada some do seletor mas continua no PAEE onde já estava vinculada, na tela e nas exportações DOCX/PDF.
6. Professor sem `ProfessorId` recebe "Professor não identificado." ao cadastrar/atualizar.
7. Admin cria habilidade → vira global (visível a A e B) e vê todas em `buscar`.
8. `PUT api/atividades/{id}/habilidades` com ID de habilidade privada não a anexa.
9. Cadastro com `tipo`/`descricao` só espaços rejeitado (cliente e servidor).

## Riscos

- `OnDelete(Cascade)` de Professor→Habilidade combina com `PlanejamentoEncontro.Habilidade` (`Restrict`): excluir uma professora que tem habilidade privada usada em encontro pode falhar no banco. Não existe fluxo de exclusão de professor no código hoje; revisar se surgir.
- `apps/web` (admin) e `apps/mobile` consomem `Habilidade/buscar`/`cadastro`: contrato só ganha campos (`ehPropria`, `objeto` no cadastro), sem quebra. Mobile passa a receber globais + próprias da professora logada.
