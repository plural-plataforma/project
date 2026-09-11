# Aceite de Termos de Uso (LGPD) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Toda professora (nova ou já cadastrada) precisa aceitar um "Termo de Uso da Ferramenta" versionado antes de continuar usando o web-app ou o app mobile, sem opção de adiar.

**Architecture:** Backend novo (`Termo` / `TermoVersao` / `AceiteTermo`) com dois endpoints (`GET /api/termos/pendentes`, `POST /api/termos/aceitar`), consumidos por um gate em cada app de usuária que roda sempre que a sessão autenticada inicia/retoma — não só no login — cobrindo quem já tinha conta antes do deploy.

**Tech Stack:** ASP.NET Core 9 / EF Core / PostgreSQL (backend); React + react-router + @tanstack/react-query + vitest (web-app); Expo Router + axios (mobile).

**Spec:** `docs/superpowers/specs/2026-09-08-aceite-termos-uso-design.md`

## Global Constraints

- Só role `Professor` passa pelo gate (Admin/Embaixadora não precisam aceitar) — decisão explícita do cliente.
- Sem opção de "adiar" o aceite — bloqueio total até aceitar.
- Sem tela de admin para gerenciar termos nesta entrega — novas versões entram via migration.
- Seguir convenções já existentes no repo: `ServiceResponse<T>` nos services .NET, tabelas/colunas em snake_case via `[Table("...")]`, DTOs em pasta própria por feature, testes vitest só onde já existe infra (mobile não tem test runner configurado — não introduzir um só para esta feature).
- Se a chamada `GET /api/termos/pendentes` falhar por erro de rede/servidor, o app **não bloqueia** a usuária (fail-open) — evita indisponibilidade travar todo mundo por uma falha transitória.

---

### Task 1: Backend — Modelos e migration

**Files:**
- Create: `apps/api/Models/Termo.cs`
- Create: `apps/api/Models/TermoVersao.cs`
- Create: `apps/api/Models/AceiteTermo.cs`
- Modify: `apps/api/Data/AppDbContext.cs`
- Create (via CLI, não escrever à mão): `apps/api/Migrations/<timestamp>_AddTermosDeUso.cs` + `.Designer.cs`
- Modify (gerado pelo CLI): `apps/api/Migrations/AppDbContextModelSnapshot.cs`

**Interfaces:**
- Produces: classes `Termo { Id, Chave, Nome }`, `TermoVersao { Id, TermoId, Termo, Versao, Texto, PublicadoEm, Ativo }`, `AceiteTermo { Id, UsuarioId, Usuario, TermoVersaoId, TermoVersao, DataAceite, Ip }`; `AppDbContext.Termos`, `AppDbContext.TermosVersoes`, `AppDbContext.AceitesTermos` (DbSets usados pela Task 2).

- [ ] **Step 1: Criar `Models/Termo.cs`**

```csharp
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace api.Models
{
    // "Tipo" de termo (ex: uso da ferramenta, IA). Cada Termo tem várias TermoVersao ao
    // longo do tempo, mas só uma fica Ativa por vez.
    [Table("termos")]
    public class Termo
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(100)]
        public string Chave { get; set; } = string.Empty;

        [Required]
        [MaxLength(200)]
        public string Nome { get; set; } = string.Empty;

        public List<TermoVersao> Versoes { get; set; } = new();
    }
}
```

- [ ] **Step 2: Criar `Models/TermoVersao.cs`**

```csharp
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace api.Models
{
    [Table("termos_versoes")]
    public class TermoVersao
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int TermoId { get; set; }
        public Termo Termo { get; set; } = null!;

        [Required]
        public int Versao { get; set; }

        [Required]
        [Column(TypeName = "text")]
        public string Texto { get; set; } = string.Empty;

        public DateTime PublicadoEm { get; set; } = DateTime.UtcNow;

        [Required]
        public bool Ativo { get; set; } = true;
    }
}
```

- [ ] **Step 3: Criar `Models/AceiteTermo.cs`**

```csharp
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace api.Models
{
    // Registro de auditoria LGPD: quem aceitou qual versão de qual termo e quando.
    [Table("aceites_termos")]
    public class AceiteTermo
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public string UsuarioId { get; set; } = string.Empty;
        public Usuario Usuario { get; set; } = null!;

        [Required]
        public int TermoVersaoId { get; set; }
        public TermoVersao TermoVersao { get; set; } = null!;

        public DateTime DataAceite { get; set; } = DateTime.UtcNow;

        [MaxLength(64)]
        public string? Ip { get; set; }
    }
}
```

- [ ] **Step 4: Registrar os `DbSet` e as constraints em `AppDbContext.cs`**

Adicionar junto aos outros `DbSet` (perto da linha 50, após `Notificacoes`):

```csharp
        public DbSet<Termo> Termos { get; set; }
        public DbSet<TermoVersao> TermosVersoes { get; set; }
        public DbSet<AceiteTermo> AceitesTermos { get; set; }
```

Adicionar em `OnModelCreating`, junto aos outros `modelBuilder.Entity<...>` (perto da configuração de `Notificacao`, por volta da linha 339):

```csharp
            modelBuilder.Entity<Termo>()
                .HasIndex(t => t.Chave)
                .IsUnique()
                .HasDatabaseName("ix_termos_chave");

            modelBuilder.Entity<TermoVersao>()
                .HasIndex(tv => new { tv.TermoId, tv.Versao })
                .IsUnique()
                .HasDatabaseName("ix_termos_versoes_termoid_versao");

            modelBuilder.Entity<AceiteTermo>()
                .HasIndex(a => new { a.UsuarioId, a.TermoVersaoId })
                .IsUnique()
                .HasDatabaseName("ix_aceites_termos_usuarioid_termoversaoid");
```

- [ ] **Step 5: Gerar a migration**

Run:
```bash
cd apps/api
dotnet tool restore
dotnet ef migrations add AddTermosDeUso
```
Expected: cria `Migrations/<timestamp>_AddTermosDeUso.cs`, `.Designer.cs`, e atualiza `AppDbContextModelSnapshot.cs`. Conferir no `.cs` gerado que as 3 tabelas (`termos`, `termos_versoes`, `aceites_termos`) e os 3 índices únicos aparecem no `Up()`.

- [ ] **Step 6: Adicionar o seed do primeiro termo na mesma migration**

Editar o arquivo `Migrations/<timestamp>_AddTermosDeUso.cs` gerado no Step 5: no final do método `Up(migrationBuilder)` (depois das `CreateTable`/`CreateIndex` que o EF gerou, sem remover nada), adicionar:

```csharp
            migrationBuilder.Sql("""
                INSERT INTO termos (chave, nome)
                SELECT 'uso_ferramenta', 'Termos de Uso da Ferramenta'
                WHERE NOT EXISTS (SELECT 1 FROM termos WHERE chave = 'uso_ferramenta');

                INSERT INTO termos_versoes (termoid, versao, texto, publicadoem, ativo)
                SELECT t.id, 1, $termo$
                <p>Ao utilizar a Plural Plataforma, você concorda com os seguintes termos:</p>
                <ol>
                  <li><strong>Uso da ferramenta</strong>: a Plural Plataforma é destinada ao uso pedagógico por profissionais da educação para apoio ao planejamento, acompanhamento e produção de documentos relacionados ao atendimento educacional de alunos.</li>
                  <li><strong>Dados tratados</strong>: você é responsável pela veracidade e adequação dos dados inseridos na plataforma, incluindo dados de alunos sob sua responsabilidade pedagógica. Evite inserir informações pessoais ou de saúde que não sejam necessárias para a finalidade pedagógica de cada registro. A Plural Plataforma trata os dados conforme a Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018).</li>
                  <li><strong>Inteligência Artificial</strong>: alguns recursos da plataforma utilizam ferramentas de inteligência artificial para apoiar a geração de documentos e sugestões pedagógicas. O conteúdo gerado deve ser revisado por você antes do uso.</li>
                  <li><strong>Conta e acesso</strong>: você é responsável por manter a confidencialidade de sua senha e por todas as atividades realizadas em sua conta.</li>
                  <li><strong>Atualizações destes termos</strong>: novos termos ou versões atualizadas poderão ser publicados conforme a evolução da plataforma. Você será notificada e precisará aceitar as novas versões para continuar utilizando a ferramenta.</li>
                  <li><strong>Direitos da titular</strong>: você pode solicitar informações sobre os dados tratados pela plataforma através do nosso canal de suporte.</li>
                </ol>
                <p>Ao clicar em "Aceitar e continuar", você declara ter lido e concordado com estes termos.</p>
                $termo$, now(), true
                FROM termos t
                WHERE t.chave = 'uso_ferramenta'
                  AND NOT EXISTS (SELECT 1 FROM termos_versoes WHERE termoid = t.id AND versao = 1);
                """);
```

Não escrever nada no `Down()` além do que o EF já gerou (o `DropTable` já reverte o seed junto).

- [ ] **Step 7: Aplicar a migration localmente e conferir**

Run:
```bash
cd apps/api
dotnet ef database update
```
Expected: sem erro. Depois, checar direto no banco (via `psql` ou client já configurado no projeto) que `SELECT * FROM termos_versoes;` retorna 1 linha com `versao = 1` e `ativo = true`.

- [ ] **Step 8: Build**

Run: `cd apps/api && dotnet build`
Expected: build sem erro novo (warnings pré-existentes do projeto continuam, não é regressão).

---

### Task 2: Backend — DTOs e `TermoService`

**Files:**
- Create: `apps/api/DTOs/Termo/TermoPendenteDTO.cs`
- Create: `apps/api/Services/TermoService.cs`

**Interfaces:**
- Consumes: `AppDbContext.Termos/.TermosVersoes/.AceitesTermos` (Task 1); `ServiceResponse<T>` (`Responses/ServiceResponse.cs`, já existe).
- Produces: `TermoService.ObterPendentesAsync(Usuario usuario) : Task<ServiceResponse<TermoPendenteDTO>>` (lista em `ListaObjetos`); `TermoService.AceitarAsync(Usuario usuario, int termoVersaoId, string? ip) : Task<ServiceResponse<object>>` — usados pela Task 3.

- [ ] **Step 1: Criar `DTOs/Termo/TermoPendenteDTO.cs`**

```csharp
namespace api.DTOs.Termo;

public class TermoPendenteDTO
{
    public int TermoVersaoId { get; set; }
    public string Chave { get; set; } = "";
    public string Nome { get; set; } = "";
    public int Versao { get; set; }
    public string Texto { get; set; } = "";
}
```

- [ ] **Step 2: Criar `Services/TermoService.cs`**

```csharp
using api.DTOs.Termo;
using api.Models;
using api.Responses;
using Data;
using Microsoft.EntityFrameworkCore;

namespace api.Services;

public class TermoService
{
    private readonly AppDbContext _db;

    public TermoService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<ServiceResponse<TermoPendenteDTO>> ObterPendentesAsync(Usuario usuario)
    {
        var resposta = new ServiceResponse<TermoPendenteDTO>();

        var aceitosIds = await _db.AceitesTermos
            .Where(a => a.UsuarioId == usuario.Id)
            .Select(a => a.TermoVersaoId)
            .ToListAsync();

        var pendentes = await _db.TermosVersoes
            .AsNoTracking()
            .Include(tv => tv.Termo)
            .Where(tv => tv.Ativo && !aceitosIds.Contains(tv.Id))
            .Select(tv => new TermoPendenteDTO
            {
                TermoVersaoId = tv.Id,
                Chave = tv.Termo.Chave,
                Nome = tv.Termo.Nome,
                Versao = tv.Versao,
                Texto = tv.Texto,
            })
            .ToListAsync();

        resposta.AdicionaObjetos(pendentes);
        return resposta;
    }

    public async Task<ServiceResponse<object>> AceitarAsync(Usuario usuario, int termoVersaoId, string? ip)
    {
        var resposta = new ServiceResponse<object>();

        var versaoExiste = await _db.TermosVersoes.AnyAsync(tv => tv.Id == termoVersaoId);
        if (!versaoExiste)
        {
            resposta.SetFalha("Versão de termo não encontrada.");
            return resposta;
        }

        var jaAceitou = await _db.AceitesTermos
            .AnyAsync(a => a.UsuarioId == usuario.Id && a.TermoVersaoId == termoVersaoId);

        if (!jaAceitou)
        {
            _db.AceitesTermos.Add(new AceiteTermo
            {
                UsuarioId = usuario.Id,
                TermoVersaoId = termoVersaoId,
                Ip = ip,
            });
            await _db.SaveChangesAsync();
        }

        resposta.AdicionaMensagem("Termo aceito com sucesso.");
        return resposta;
    }
}
```

- [ ] **Step 3: Build**

Run: `cd apps/api && dotnet build`
Expected: sem erro novo.

---

### Task 3: Backend — `TermosController` e registro de DI

**Files:**
- Create: `apps/api/Controllers/TermosController.cs`
- Modify: `apps/api/Program.cs:219` (logo após `builder.Services.AddScoped<ArtigoService>();`, mesmo bloco de `AddScoped`)

**Interfaces:**
- Consumes: `TermoService.ObterPendentesAsync`, `TermoService.AceitarAsync` (Task 2).
- Produces: `GET /api/termos/pendentes`, `POST /api/termos/aceitar` — consumidos pelas Tasks 4 e 6.

- [ ] **Step 1: Registrar o `TermoService` no `Program.cs`**

Adicionar logo abaixo de `builder.Services.AddScoped<ArtigoService>();`:

```csharp
builder.Services.AddScoped<TermoService>();
```

- [ ] **Step 2: Criar `Controllers/TermosController.cs`**

```csharp
using api.Models;
using api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace api.Controllers;

[Authorize(Roles = "Professor")]
[ApiController]
[Route("api/termos")]
public class TermosController : ControllerBase
{
    private readonly TermoService _service;
    private readonly UserManager<Usuario> _usuario;

    public TermosController(TermoService service, UserManager<Usuario> usuario)
    {
        _service = service;
        _usuario = usuario;
    }

    [HttpGet("pendentes")]
    public async Task<IActionResult> Pendentes()
    {
        var usuario = await _usuario.GetUserAsync(User);
        if (usuario == null)
            return Unauthorized();

        var resposta = await _service.ObterPendentesAsync(usuario);
        return Ok(resposta);
    }

    public class AceitarTermoDTO
    {
        public int TermoVersaoId { get; set; }
    }

    [HttpPost("aceitar")]
    public async Task<IActionResult> Aceitar([FromBody] AceitarTermoDTO dto)
    {
        var usuario = await _usuario.GetUserAsync(User);
        if (usuario == null)
            return Unauthorized();

        var ip = HttpContext.Connection.RemoteIpAddress?.ToString();
        var resposta = await _service.AceitarAsync(usuario, dto.TermoVersaoId, ip);

        return resposta.Sucesso ? Ok(resposta) : BadRequest(resposta);
    }
}
```

- [ ] **Step 3: Build e teste manual**

Run: `cd apps/api && dotnet build`
Expected: sem erro novo.

Run local (`dotnet run`), depois testar via Swagger/curl com um token JWT de uma professora de teste:
```bash
curl -H "Authorization: Bearer <token>" http://localhost:<porta>/api/termos/pendentes
```
Expected: `200 OK` com `listaObjetos` contendo 1 item (`versao: 1, chave: "uso_ferramenta"`).

```bash
curl -X POST -H "Authorization: Bearer <token>" -H "Content-Type: application/json" \
  -d '{"termoVersaoId": <id-retornado-acima>}' \
  http://localhost:<porta>/api/termos/aceitar
```
Expected: `200 OK`, `sucesso: true`. Repetir o `GET /api/termos/pendentes`: `listaObjetos` deve vir vazio.

- [ ] **Step 4: Commit**

Não faço o commit (regra do CLAUDE.md do usuário: git só por ele). Informar ao usuário os arquivos alterados e sugerir mensagem, ex: `feat(api): adiciona modelo, service e endpoints de aceite de termos de uso`.

---

### Task 4: web-app — tipos, service e hook de termos pendentes

**Files:**
- Create: `apps/web-app/src/types/termo.ts`
- Create: `apps/web-app/src/services/termoService.ts`
- Create: `apps/web-app/src/services/termoService.test.ts`
- Create: `apps/web-app/src/hooks/useTermosPendentes.ts`

**Interfaces:**
- Consumes: `api` (axios instance) de `@/api/http` (já existe).
- Produces: `TermoPendente` type; `listarTermosPendentes(): Promise<TermoPendente[]>`; `aceitarTermo(termoVersaoId: number): Promise<void>`; hook `useTermosPendentes()` retornando `{ pendentes, isLoading, isError, aceitar, aceitando }` — usado pela Task 5.

- [ ] **Step 1: Criar `types/termo.ts`**

```typescript
export interface TermoPendente {
  termoVersaoId: number
  chave: string
  nome: string
  versao: number
  texto: string
}

export interface TermoResponse {
  sucesso: boolean
  mensagens: string[]
  objeto: TermoPendente | null
  listaObjetos: TermoPendente[]
}
```

- [ ] **Step 2: Escrever o teste do service (falhando) em `services/termoService.test.ts`**

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { listarTermosPendentes, aceitarTermo } from './termoService'
import { api } from '@/api/http'

vi.mock('@/api/http', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

describe('termoService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('listarTermosPendentes', () => {
    it('retorna a lista quando a API responde com sucesso', async () => {
      vi.mocked(api.get).mockResolvedValue({
        data: {
          sucesso: true,
          listaObjetos: [
            { termoVersaoId: 1, chave: 'uso_ferramenta', nome: 'Termos de Uso da Ferramenta', versao: 1, texto: '<p>...</p>' },
          ],
        },
      })

      const result = await listarTermosPendentes()

      expect(result).toHaveLength(1)
      expect(api.get).toHaveBeenCalledWith('/termos/pendentes')
    })

    it('retorna array vazio quando não há pendências', async () => {
      vi.mocked(api.get).mockResolvedValue({ data: { sucesso: true, listaObjetos: [] } })

      const result = await listarTermosPendentes()

      expect(result).toEqual([])
    })
  })

  describe('aceitarTermo', () => {
    it('chama o endpoint correto', async () => {
      vi.mocked(api.post).mockResolvedValue({ data: { sucesso: true } })

      await aceitarTermo(1)

      expect(api.post).toHaveBeenCalledWith('/termos/aceitar', { termoVersaoId: 1 })
    })

    it('lança erro quando API retorna falha', async () => {
      vi.mocked(api.post).mockResolvedValue({ data: { sucesso: false, mensagens: ['Versão de termo não encontrada.'] } })

      await expect(aceitarTermo(1)).rejects.toThrow('Versão de termo não encontrada.')
    })
  })
})
```

- [ ] **Step 3: Rodar o teste e confirmar que falha**

Run: `cd apps/web-app && npx vitest run src/services/termoService.test.ts`
Expected: FAIL — `Cannot find module './termoService'` (arquivo ainda não existe).

- [ ] **Step 4: Criar `services/termoService.ts`**

```typescript
import { api } from '@/api/http'
import type { TermoPendente, TermoResponse } from '@/types/termo'

export const listarTermosPendentes = async (): Promise<TermoPendente[]> => {
  const response = await api.get<TermoResponse>('/termos/pendentes')
  if (response.data.sucesso) return response.data.listaObjetos ?? []
  throw new Error(response.data.mensagens?.join(', ') || 'Falha ao carregar termos pendentes')
}

export const aceitarTermo = async (termoVersaoId: number): Promise<void> => {
  const response = await api.post<TermoResponse>('/termos/aceitar', { termoVersaoId })
  if (!response.data.sucesso) {
    throw new Error(response.data.mensagens?.join(', ') || 'Falha ao aceitar termo')
  }
}
```

- [ ] **Step 5: Rodar o teste e confirmar que passa**

Run: `cd apps/web-app && npx vitest run src/services/termoService.test.ts`
Expected: PASS (5 testes).

- [ ] **Step 6: Criar `hooks/useTermosPendentes.ts`**

```typescript
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { listarTermosPendentes, aceitarTermo } from '@/services/termoService'

export function useTermosPendentes(enabled: boolean) {
  const qc = useQueryClient()

  const { data: pendentes = [], isLoading, isError } = useQuery({
    queryKey: ['termos-pendentes'],
    queryFn: () => listarTermosPendentes(),
    enabled,
    retry: false,
  })

  const aceitarMutation = useMutation({
    mutationFn: (termoVersaoId: number) => aceitarTermo(termoVersaoId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['termos-pendentes'] }),
  })

  return {
    pendentes,
    isLoading,
    isError,
    aceitar: aceitarMutation.mutateAsync,
    aceitando: aceitarMutation.isPending,
  }
}
```

- [ ] **Step 7: Build/typecheck**

Run: `cd apps/web-app && npx tsc --noEmit`
Expected: sem erro novo.

---

### Task 5: web-app — tela de aceite e gate no `ProtectedRoute`

**Files:**
- Create: `apps/web-app/src/pages/auth/AceitarTermosPage.tsx`
- Modify: `apps/web-app/src/routes/ProtectedRoute.tsx`
- Modify: `apps/web-app/src/routes/ProtectedRoute.test.tsx`
- Modify: `apps/web-app/src/routes/index.tsx`

**Interfaces:**
- Consumes: `useTermosPendentes` (Task 4); `useAuth` de `@/context/AuthContext` (já existe); `useOnboardingStore` (já existe).

- [ ] **Step 1: Criar `pages/auth/AceitarTermosPage.tsx`**

```tsx
import { useState } from 'react'
import { useTermosPendentes } from '@/hooks/useTermosPendentes'

interface AceitarTermosPageProps {
  onAceito: () => void
}

export default function AceitarTermosPage({ onAceito }: AceitarTermosPageProps) {
  const { pendentes, isLoading, aceitar, aceitando } = useTermosPendentes(true)
  const [erro, setErro] = useState<string | null>(null)

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-10 w-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    )
  }

  const termoAtual = pendentes[0]

  if (!termoAtual) {
    onAceito()
    return null
  }

  const handleAceitar = async () => {
    setErro(null)
    try {
      await aceitar(termoAtual.termoVersaoId)
      if (pendentes.length <= 1) onAceito()
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao aceitar o termo. Tente novamente.')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-2xl w-full bg-card rounded-lg shadow-lg p-6 md:p-8">
        <h1 className="text-xl font-bold mb-4">{termoAtual.nome}</h1>
        <div
          className="prose max-w-none text-sm text-muted-foreground max-h-[50vh] overflow-y-auto mb-6"
          dangerouslySetInnerHTML={{ __html: termoAtual.texto }}
        />
        {erro && <p className="text-sm text-destructive mb-4">{erro}</p>}
        <button
          type="button"
          onClick={handleAceitar}
          disabled={aceitando}
          className="w-full bg-primary text-primary-foreground rounded-md py-2.5 font-medium disabled:opacity-60"
        >
          {aceitando ? 'Salvando...' : 'Aceitar e continuar'}
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Escrever os testes novos do `ProtectedRoute` (falhando)**

Adicionar no fim de `routes/ProtectedRoute.test.tsx`, dentro do `describe('ProtectedRoute', ...)` já existente (mantendo os mocks de `useAuth` e `useOnboardingStore` já configurados no `beforeEach`):

```typescript
vi.mock('@/hooks/useTermosPendentes', () => ({
  useTermosPendentes: vi.fn(),
}))
```

(esse `vi.mock` vai no topo do arquivo, junto aos outros `vi.mock`). E os `import { useTermosPendentes } from '@/hooks/useTermosPendentes'` junto aos outros imports.

No `beforeEach`, adicionar:
```typescript
vi.mocked(useTermosPendentes).mockReturnValue({
  pendentes: [],
  isLoading: false,
  isError: false,
  aceitar: vi.fn(),
  aceitando: false,
} as any)
```

E os novos testes:
```typescript
  it('redireciona para /aceitar-termos quando há termo pendente', () => {
    vi.mocked(useTermosPendentes).mockReturnValue({
      pendentes: [{ termoVersaoId: 1, chave: 'uso_ferramenta', nome: 'Termos', versao: 1, texto: '<p>x</p>' }],
      isLoading: false,
      isError: false,
      aceitar: vi.fn(),
      aceitando: false,
    } as any)

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<div>Dashboard</div>} />
          </Route>
          <Route path="/aceitar-termos" element={<div>Aceitar Termos</div>} />
        </Routes>
      </MemoryRouter>
    )

    expect(screen.getByText('Aceitar Termos')).toBeInTheDocument()
  })

  it('não bloqueia quando a checagem de termos falha (fail-open)', () => {
    vi.mocked(useTermosPendentes).mockReturnValue({
      pendentes: [],
      isLoading: false,
      isError: true,
      aceitar: vi.fn(),
      aceitando: false,
    } as any)

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<div>Dashboard Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    )

    expect(screen.getByText('Dashboard Content')).toBeInTheDocument()
  })
```

- [ ] **Step 3: Rodar os testes e confirmar que falham**

Run: `cd apps/web-app && npx vitest run src/routes/ProtectedRoute.test.tsx`
Expected: FAIL nos 2 testes novos (`ProtectedRoute` ainda não usa `useTermosPendentes`, redireciona errado ou nem redireciona).

- [ ] **Step 4: Atualizar `routes/ProtectedRoute.tsx`**

```tsx
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useOnboardingStore } from '@/stores/onboardingStore'
import { useTermosPendentes } from '@/hooks/useTermosPendentes'

export function ProtectedRoute() {
  const { isLoggedIn, loading } = useAuth()
  const hasSeenOnboarding = useOnboardingStore((s) => s.hasSeenOnboarding)
  const location = useLocation()
  const { pendentes, isLoading: termosLoading, isError: termosError } = useTermosPendentes(isLoggedIn)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <span className="text-sm text-muted-foreground font-medium">Carregando...</span>
        </div>
      </div>
    )
  }

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />
  }

  // Fail-open: se a checagem de termos falhar (rede/servidor), não bloqueia a usuária.
  if (termosLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-10 w-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    )
  }

  if (!termosError && pendentes.length > 0 && location.pathname !== '/aceitar-termos') {
    return <Navigate to="/aceitar-termos" replace />
  }

  // Primeira vez logado: redireciona para onboarding antes de acessar a app
  if (!hasSeenOnboarding) {
    return (
      <Navigate
        to="/onboarding"
        replace
        state={{ destination: location.pathname || '/dashboard' }}
      />
    )
  }

  return <Outlet />
}
```

- [ ] **Step 5: Rodar os testes e confirmar que passam**

Run: `cd apps/web-app && npx vitest run src/routes/ProtectedRoute.test.tsx`
Expected: PASS (todos os testes, incluindo os 4 originais).

- [ ] **Step 6: Registrar a rota `/aceitar-termos` em `routes/index.tsx`**

Adicionar o import junto aos outros de auth (perto de `ChangePasswordPage`):
```typescript
import AceitarTermosPage from '@/pages/auth/AceitarTermosPage'
```

Adicionar a rota dentro do bloco `<Route element={<ProtectedRoute />}>`, fora do `<Route element={<AppShell />}>` (tela cheia, sem menu/shell), logo antes dele:
```tsx
        <Route element={<ProtectedRoute />}>
          <Route
            path="/aceitar-termos"
            element={<AceitarTermosPage onAceito={() => window.location.assign('/dashboard')} />}
          />
          <Route element={<AppShell />}>
```
(mantendo todo o conteúdo já existente dentro de `<AppShell />>` sem alteração, só fechando as tags corretamente).

- [ ] **Step 7: Rodar o typecheck e a suíte completa do web-app**

Run: `cd apps/web-app && npx tsc --noEmit && npx vitest run`
Expected: sem erro de tipo novo; suíte de testes passando (falhas pré-existentes, se houver, não pioram).

- [ ] **Step 8: Verificação manual**

Rodar `npm run dev` no `apps/web-app` (você roda, não eu — só documentando o passo), logar com uma professora de teste que ainda não tenha `AceiteTermo` no banco, confirmar que cai direto na tela de aceite, sem conseguir navegar pra outra rota digitando a URL, e que depois de aceitar vai pro dashboard e não pede de novo ao recarregar a página.

- [ ] **Step 9: Commit**

Não faço o commit. Sugestão de mensagem: `feat(web-app): adiciona gate de aceite de termos de uso para toda professora`.

---

### Task 6: mobile — service e tela de aceite

**Files:**
- Create: `apps/mobile/src/services/termosService.ts`
- Create: `apps/mobile/src/app/auth/aceitarTermos.tsx`
- Modify: `apps/mobile/src/app/dashboard/index.tsx`

**Interfaces:**
- Consumes: `api` (axios instance exportado) de `@src/services/auth` (já existe).

Sem testes automatizados nesta task — o projeto mobile não tem test runner configurado (`apps/mobile/package.json` não tem script `test`), e introduzir um agora é fora de escopo desta feature. Cada step de código é seguido de um step de verificação manual.

- [ ] **Step 1: Criar `services/termosService.ts`**

```typescript
import { api } from './auth';

export interface TermoPendente {
  termoVersaoId: number;
  chave: string;
  nome: string;
  versao: number;
  texto: string;
}

interface TermoResponse {
  sucesso: boolean;
  mensagens: string[];
  objeto: TermoPendente | null;
  listaObjetos: TermoPendente[];
}

export const listarTermosPendentes = async (): Promise<TermoPendente[]> => {
  const response = await api.get<TermoResponse>('Termos/pendentes');
  if (response.data.sucesso) return response.data.listaObjetos ?? [];
  throw new Error(response.data.mensagens?.join(', ') || 'Falha ao carregar termos pendentes');
};

export const aceitarTermo = async (termoVersaoId: number): Promise<void> => {
  const response = await api.post<TermoResponse>('Termos/aceitar', { termoVersaoId });
  if (!response.data.sucesso) {
    throw new Error(response.data.mensagens?.join(', ') || 'Falha ao aceitar termo');
  }
};
```

- [ ] **Step 2: Verificar a base URL do client `api`**

Run: `grep -n "baseURL" apps/mobile/src/services/auth.ts`
Expected: confirma se a `baseURL` já inclui `/api` (nesse caso o path acima seria só `termos/pendentes` sem o prefixo) ou não (path como escrito acima, com `Termos/pendentes` casando o padrão `Autenticacao/login` já usado no mesmo arquivo). Ajustar o path em `termosService.ts` pra bater com o mesmo prefixo usado por `api.post('Autenticacao/login', ...)`.

- [ ] **Step 3: Criar a tela `app/auth/aceitarTermos.tsx`**

```tsx
import { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, Text, ScrollView, BackHandler } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, fontSizes } from '@packages/ui/theme/theme';
import CustomButton from '@src/components/CustomButton';
import Header from '@src/components/Header';
import { listarTermosPendentes, aceitarTermo, type TermoPendente } from '@src/services/termosService';
import { useCustomAlert } from '@src/hooks/useCustomAlert';

export default function AceitarTermosScreen() {
  const router = useRouter();
  const { showAlert } = useCustomAlert();
  const [loading, setLoading] = useState(true);
  const [aceitando, setAceitando] = useState(false);
  const [pendentes, setPendentes] = useState<TermoPendente[]>([]);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const lista = await listarTermosPendentes();
      setPendentes(lista);
      if (lista.length === 0) {
        router.replace('/dashboard');
      }
    } catch (e) {
      showAlert('Erro', 'Não foi possível carregar os termos de uso. Tente novamente.', [
        { text: 'Tentar novamente', onPress: carregar },
      ]);
    } finally {
      setLoading(false);
    }
  }, [router, showAlert]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  // Bloqueia o botão físico de voltar do Android — aceite não pode ser adiado.
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => subscription.remove();
  }, []);

  const termoAtual = pendentes[0];

  const handleAceitar = async () => {
    if (!termoAtual) return;
    setAceitando(true);
    try {
      await aceitarTermo(termoAtual.termoVersaoId);
      const restantes = pendentes.slice(1);
      setPendentes(restantes);
      if (restantes.length === 0) {
        router.replace('/dashboard');
      }
    } catch (e) {
      showAlert('Erro', 'Não foi possível registrar o aceite. Tente novamente.', [{ text: 'OK' }]);
    } finally {
      setAceitando(false);
    }
  };

  if (loading || !termoAtual) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Termos de Uso" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header title={termoAtual.nome} />
      <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
        <Text style={styles.texto}>{termoAtual.texto.replace(/<[^>]+>/g, '\n').trim()}</Text>
      </ScrollView>
      <View style={styles.footer}>
        <CustomButton
          title={aceitando ? 'Salvando...' : 'Aceitar e continuar'}
          onPress={handleAceitar}
          disabled={aceitando}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1 },
  contentInner: { padding: 20 },
  texto: { fontSize: fontSizes.md, color: colors.text, lineHeight: 22 },
  footer: { padding: 20 },
});
```

Nota: o `texto` vem em HTML simples (mesmo conteúdo usado no web-app). Como React Native não renderiza HTML nativamente e o projeto não tem nenhuma lib de WebView/HTML-render instalada, o `replace(/<[^>]+>/g, '\n')` acima é uma solução mínima (strip de tags, quebra de linha) — suficiente pro texto genérico desta entrega. Se o conteúdo dos termos crescer em formatação, vale revisitar com uma lib de markdown/HTML depois (fora de escopo agora).

- [ ] **Step 4: Adicionar o gate em `app/dashboard/index.tsx`**

Adicionar o import junto aos demais, no topo do arquivo:
```typescript
import { listarTermosPendentes } from '@src/services/termosService';
```

Adicionar, logo após o bloco existente `// Carregamento inicial` (por volta da linha 148-153 do arquivo atual), um novo efeito:
```typescript
  // ==================== GATE DE ACEITE DE TERMOS ====================
  // Diferente da troca de senha (que pode ser adiada), aceite de termos é obrigatório:
  // sem opção de pular, checado sempre que a sessão autenticada entra nesta tela.
  useEffect(() => {
    if (authLoading || !isLoggedIn) return;

    let cancelado = false;

    (async () => {
      try {
        const pendentes = await listarTermosPendentes();
        if (!cancelado && pendentes.length > 0) {
          router.replace('/auth/aceitarTermos');
        }
      } catch (e) {
        // Fail-open: falha de rede/servidor não deve travar o acesso ao app.
        console.warn('Não foi possível checar termos pendentes:', e);
      }
    })();

    return () => {
      cancelado = true;
    };
  }, [authLoading, isLoggedIn, router]);
```

- [ ] **Step 5: Verificação manual**

Rodar o app mobile (você roda, não eu), logar com uma professora de teste sem `AceiteTermo` no banco, confirmar: (a) app navega automaticamente pra tela de termos; (b) botão físico de voltar do Android não sai da tela; (c) depois de aceitar, vai pro dashboard normalmente; (d) fechar e reabrir o app não pede de novo.

- [ ] **Step 6: Commit**

Não faço o commit. Sugestão de mensagem: `feat(mobile): adiciona tela e gate de aceite de termos de uso`.

---

## Self-Review

**Cobertura da spec:** modelo de dados (Task 1), endpoints (Task 3), gate web-app (Task 5), gate mobile (Task 6), seed do primeiro termo (Task 1 Step 6), sem CRUD de admin (fora de escopo, não implementado), sem gate para Admin/Embaixadora (`[Authorize(Roles = "Professor")]` na Task 3), sem opção de adiar (nenhuma das duas telas tem botão de recusar/pular).

**Placeholders:** nenhum "TBD"/"implementar depois" — toda task tem código completo.

**Consistência de tipos:** `TermoPendenteDTO` (C#) ↔ `TermoPendente` (TS, web-app e mobile) têm os mesmos campos (`termoVersaoId`, `chave`, `nome`, `versao`, `texto`) em camelCase, batendo com a serialização JSON padrão do ASP.NET Core (camelCase) confirmada nas features anteriores desta sessão. `TermoService.ObterPendentesAsync`/`AceitarAsync` (Task 2) usados exatamente com essas assinaturas em `TermosController` (Task 3).
