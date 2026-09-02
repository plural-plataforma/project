# Geração de Relatório em Background + Notificações Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tirar a geração por IA do Relatório Pedagógico do ciclo de requisição HTTP (hoje estoura o timeout do front porque gera as 14 seções numa única chamada Gemini) — o cadastro/regeração passa a responder na hora com status `Gerando`, o texto é montado em background, e a professora é avisada por uma notificação no sistema quando terminar (sucesso ou erro), podendo sair da tela sem perder o resultado.

**Architecture:** Fila em memória (`Channel<int>`) + `BackgroundService` consumidor, no mesmo padrão já usado em `HotmartReconciliacaoAssinaturasJob` (scope por item via `IServiceScopeFactory`). `RelatorioService.CriarAsync`/`GerarNovamenteAsync` passam a só validar, gravar o relatório com `Status.Gerando` e enfileirar — quem chama a IA e grava as seções é o worker, num método novo `ProcessarGeracaoAsync`. Uma tabela `notificacoes` nova (modelo simples, sem FK EF — mesmo padrão de `GeracaoIALog.DocumentoId`) registra o resultado; o front lê essa tabela via polling curto (React Query `refetchInterval`) e mostra um sino na Sidebar.

**Tech Stack:** .NET 9 / EF Core / PostgreSQL (`apps/api`), React + TanStack Query + Tailwind + Radix (`apps/web-app`), Gemini REST API via `IGeradorTextoIA`.

**Spec:** Sem documento formal — nasceu de uma sessão de debug ao vivo (bug reproduzido no ambiente dev: `POST /api/Relatorio/cadastro` sempre falha com `Timeout · POST /Relatorio/cadastro`, causa raiz identificada em `RelatorioService.GerarSecoesAsync` gerando 14 seções numa chamada só) seguida de uma conversa de design com o usuário, que pediu explicitamente: geração em background + aba/sino de notificação avisando quando terminar, além de corrigir o descasamento de timeout (front 30s em `apps/web-app/src/api/http.ts:18` vs `HttpClient` do Gemini sem timeout explícito, default 100s).

## Global Constraints

- Sem chamadas de build/migration/teste executadas automaticamente pelo implementador — toda `dotnet build`, `dotnet ef migrations add`, `dotnet ef database update` é fornecida como comando para o usuário rodar localmente (restrição do projeto, ver `CLAUDE.md`).
- Backend (`apps/api`) não tem projeto de testes automatizados hoje (`apps/api.Tests` existe vazio, sem `.csproj`) — os passos de verificação das tasks de backend são manuais (`dotnet build` + smoke test via Swagger/curl), seguindo o padrão já estabelecido nas features anteriores (Estudo de Caso IA, Biblioteca de Documentos). Não criar infraestrutura de teste de backend nova sem pedido explícito (YAGNI).
- Frontend (`apps/web-app`) tem Vitest + Testing Library configurado e é o padrão real do projeto (ver `relatorioService.test.ts`, `useToast.test.tsx`) — todas as tasks de frontend seguem TDD com esse stack.
- Fila de geração é em memória, não durável: se a API reiniciar com itens na fila, o relatório fica preso em `Gerando` — não introduzir fila persistida (Redis/Postgres outbox) pra isso; o botão "Gerar novamente" já existente na tela do relatório é o caminho de recuperação manual. Documentar essa decisão no código (comentário), não escondê-la.
- Notificação é uma tabela simples com `Tipo` (enum) e `RelatorioId` (int? solto, não FK EF) — mesmo padrão de `GeracaoIALog`. Não modelar como sistema polimórfico genérico "notificação de qualquer entidade" — YAGNI, resolve só o caso real (Relatório).
- Sem commit automático — o usuário decide e executa toda operação de Git. Ao final de cada task, listar os arquivos alterados.
- Nomenclatura, mensagens de usuário e comentários em português (padrão do projeto); identificadores de código também em português (`Relatorio`, `Notificacao`, `Gerando`), igual ao restante da base.

---

### Task 1: Enum `RelatorioStatus` + model `Notificacao` + migration

**Files:**
- Modify: `apps/api/Models/Relatorio.cs:14-18` (enum `RelatorioStatus`)
- Create: `apps/api/Models/TipoNotificacao.cs`
- Create: `apps/api/Models/Notificacao.cs`
- Modify: `apps/api/Data/AppDbContext.cs:49` (adicionar `DbSet<Notificacao>` logo após `Artigos`)

**Interfaces:**
- Produces: `RelatorioStatus` com `Gerando = 2` e `ErroGeracao = 3` adicionados (mantém `Rascunho = 0`, `Finalizado = 1`); `TipoNotificacao { RelatorioGerado = 0, RelatorioComErro = 1 }`; `Notificacao { Id: int, ProfessorId: int, Tipo: TipoNotificacao, Titulo: string, Mensagem: string, RelatorioId: int?, Lida: bool, CreatedAt: DateTime }`; `AppDbContext.Notificacoes: DbSet<Notificacao>`.

- [ ] **Step 1: Estender o enum `RelatorioStatus`**

Em `apps/api/Models/Relatorio.cs`, trocar:

```csharp
    public enum RelatorioStatus
    {
        Rascunho = 0,
        Finalizado = 1,
    }
```

por:

```csharp
    // Gerando: aguardando o worker de background processar a IA (ver RelatorioGeracaoWorker).
    // ErroGeracao: o worker tentou e falhou (IA fora do ar, resposta inesperada, etc.) —
    // a professora pode tentar de novo pelo botão "Gerar novamente".
    public enum RelatorioStatus
    {
        Rascunho = 0,
        Finalizado = 1,
        Gerando = 2,
        ErroGeracao = 3,
    }
```

- [ ] **Step 2: Criar o enum `TipoNotificacao`**

```csharp
// apps/api/Models/TipoNotificacao.cs
namespace api.Models
{
    public enum TipoNotificacao
    {
        RelatorioGerado = 0,
        RelatorioComErro = 1,
    }
}
```

- [ ] **Step 3: Criar o model `Notificacao`**

```csharp
// apps/api/Models/Notificacao.cs
using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace api.Models
{
    // Notificação assíncrona pro professor — hoje só avisa sobre geração de Relatório
    // Pedagógico em background (ver RelatorioGeracaoWorker), mas o campo Tipo permite outros
    // eventos no futuro sem migração nova. RelatorioId não é FK (mesmo padrão de
    // GeracaoIALog.DocumentoId) — é só referência pra navegação no front.
    [Table("notificacoes")]
    public class Notificacao
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int ProfessorId { get; set; }

        [Required]
        public TipoNotificacao Tipo { get; set; }

        [Required]
        [MaxLength(200)]
        public string Titulo { get; set; } = string.Empty;

        [Required]
        [Column(TypeName = "text")]
        public string Mensagem { get; set; } = string.Empty;

        public int? RelatorioId { get; set; }

        [Required]
        public bool Lida { get; set; } = false;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
```

- [ ] **Step 4: Registrar o `DbSet` no `AppDbContext`**

Em `apps/api/Data/AppDbContext.cs`, logo abaixo de `public DbSet<Artigo> Artigos { get; set; }`, adicionar:

```csharp
        public DbSet<Notificacao> Notificacoes { get; set; }
```

- [ ] **Step 5: Gerar e aplicar a migration (comandos para o usuário rodar)**

```bash
cd apps/api
dotnet ef migrations add AddRelatorioStatusGerandoENotificacoes
dotnet ef database update
```

Expected: migration criada em `apps/api/Migrations/` com `AddColumn` de nada em `relatorios_pedagogicos` (o novo status é só valor de enum, não coluna nova) e `CreateTable("notificacoes")`; `database update` aplica sem erro.

- [ ] **Step 6: Build**

```bash
cd apps/api
dotnet build
```

Expected: build sem erro.

- [ ] **Step 7: Listar arquivos alterados (sem commit — o usuário decide)**

```bash
git status --short apps/api/Models/Relatorio.cs apps/api/Models/TipoNotificacao.cs apps/api/Models/Notificacao.cs apps/api/Data/AppDbContext.cs apps/api/Migrations/
```

---

### Task 2: `NotificacaoService`

**Files:**
- Create: `apps/api/DTOs/Notificacao/NotificacaoDTO.cs`
- Create: `apps/api/Services/NotificacaoService.cs`
- Modify: `apps/api/Program.cs:214-216` (registrar `NotificacaoService` no DI, perto de `GeracaoIALogService`)

**Interfaces:**
- Consumes: `AppDbContext` (via `Data.AppDbContext`), `ServiceResponse<T>` (`api.Responses`), `Usuario.ProfessorId` (mesmo padrão de `RelatorioController`/`RelatorioService`).
- Produces: `NotificacaoDTO { Id: int, Tipo: TipoNotificacao, Titulo: string, Mensagem: string, RelatorioId: int?, Lida: bool, CreatedAt: DateTime }`; `NotificacaoService.CriarAsync(int professorId, TipoNotificacao tipo, string titulo, string mensagem, int? relatorioId): Task` (usado pelo worker na Task 4); `NotificacaoService.ListarAsync(Usuario usuario, bool apenasNaoLidas): Task<ServiceResponse<NotificacaoDTO>>`; `NotificacaoService.MarcarComoLidaAsync(int id, Usuario usuario): Task<ServiceResponse<NotificacaoDTO>>`; `NotificacaoService.MarcarTodasComoLidasAsync(Usuario usuario): Task<ServiceResponse<NotificacaoDTO>>`.

- [ ] **Step 1: Criar o DTO**

```csharp
// apps/api/DTOs/Notificacao/NotificacaoDTO.cs
using api.Models;

namespace api.DTOs.Notificacao;

public class NotificacaoDTO
{
    public int Id { get; set; }
    public TipoNotificacao Tipo { get; set; }
    public string Titulo { get; set; } = "";
    public string Mensagem { get; set; } = "";
    public int? RelatorioId { get; set; }
    public bool Lida { get; set; }
    public DateTime CreatedAt { get; set; }
}
```

- [ ] **Step 2: Criar o `NotificacaoService`**

```csharp
// apps/api/Services/NotificacaoService.cs
using api.DTOs.Notificacao;
using api.Models;
using api.Responses;
using Data;
using Microsoft.EntityFrameworkCore;

namespace api.Services;

public class NotificacaoService
{
    private readonly AppDbContext _db;

    public NotificacaoService(AppDbContext db)
    {
        _db = db;
    }

    // Chamado pelo RelatorioGeracaoWorker (Task 4) ao fim do processamento — nunca deve
    // derrubar o worker, mas se falhar aqui o próprio SaveChanges já propaga a exceção pro
    // catch do worker, que loga e segue pro próximo item da fila.
    public async Task CriarAsync(int professorId, TipoNotificacao tipo, string titulo, string mensagem, int? relatorioId)
    {
        _db.Notificacoes.Add(new Notificacao
        {
            ProfessorId = professorId,
            Tipo = tipo,
            Titulo = titulo,
            Mensagem = mensagem,
            RelatorioId = relatorioId,
        });
        await _db.SaveChangesAsync();
    }

    public async Task<ServiceResponse<NotificacaoDTO>> ListarAsync(Usuario usuario, bool apenasNaoLidas)
    {
        var resposta = new ServiceResponse<NotificacaoDTO>();
        var professorId = usuario.ProfessorId ?? 0;
        if (professorId == 0)
        {
            resposta.SetFalha("Professor não identificado.");
            return resposta;
        }

        var query = _db.Notificacoes.AsNoTracking().Where(n => n.ProfessorId == professorId);
        if (apenasNaoLidas)
            query = query.Where(n => !n.Lida);

        var notificacoes = await query
            .OrderByDescending(n => n.CreatedAt)
            .Take(50)
            .Select(n => new NotificacaoDTO
            {
                Id = n.Id,
                Tipo = n.Tipo,
                Titulo = n.Titulo,
                Mensagem = n.Mensagem,
                RelatorioId = n.RelatorioId,
                Lida = n.Lida,
                CreatedAt = n.CreatedAt,
            })
            .ToListAsync();

        resposta.AdicionaObjetos(notificacoes);
        return resposta;
    }

    public async Task<ServiceResponse<NotificacaoDTO>> MarcarComoLidaAsync(int id, Usuario usuario)
    {
        var resposta = new ServiceResponse<NotificacaoDTO>();
        var professorId = usuario.ProfessorId ?? 0;
        if (professorId == 0)
        {
            resposta.SetFalha("Professor não identificado.");
            return resposta;
        }

        var notificacao = await _db.Notificacoes.FirstOrDefaultAsync(n => n.Id == id && n.ProfessorId == professorId);
        if (notificacao == null)
        {
            resposta.SetFalha("Notificação não encontrada.");
            return resposta;
        }

        notificacao.Lida = true;
        await _db.SaveChangesAsync();

        resposta.AdicionaObjeto(new NotificacaoDTO
        {
            Id = notificacao.Id,
            Tipo = notificacao.Tipo,
            Titulo = notificacao.Titulo,
            Mensagem = notificacao.Mensagem,
            RelatorioId = notificacao.RelatorioId,
            Lida = notificacao.Lida,
            CreatedAt = notificacao.CreatedAt,
        });
        return resposta;
    }

    public async Task<ServiceResponse<NotificacaoDTO>> MarcarTodasComoLidasAsync(Usuario usuario)
    {
        var resposta = new ServiceResponse<NotificacaoDTO>();
        var professorId = usuario.ProfessorId ?? 0;
        if (professorId == 0)
        {
            resposta.SetFalha("Professor não identificado.");
            return resposta;
        }

        var naoLidas = await _db.Notificacoes
            .Where(n => n.ProfessorId == professorId && !n.Lida)
            .ToListAsync();

        foreach (var n in naoLidas)
            n.Lida = true;

        await _db.SaveChangesAsync();
        return resposta;
    }
}
```

- [ ] **Step 3: Registrar no DI**

Em `apps/api/Program.cs`, logo abaixo de `builder.Services.AddScoped<GeracaoIALogService>();` (linha 215), adicionar:

```csharp
builder.Services.AddScoped<NotificacaoService>();
```

- [ ] **Step 4: Build**

```bash
cd apps/api
dotnet build
```

Expected: build sem erro.

- [ ] **Step 5: Listar arquivos alterados**

```bash
git status --short apps/api/DTOs/Notificacao/ apps/api/Services/NotificacaoService.cs apps/api/Program.cs
```

---

### Task 3: `NotificacaoController`

**Files:**
- Create: `apps/api/Controllers/NotificacaoController.cs`

**Interfaces:**
- Consumes: `NotificacaoService` (Task 2).
- Produces: `GET /api/Notificacao/listar?apenasNaoLidas={bool}`, `POST /api/Notificacao/{id}/marcar-lida`, `POST /api/Notificacao/marcar-todas-lidas` — todos retornando `ServiceResponse<NotificacaoDTO>`.

- [ ] **Step 1: Criar o controller**

```csharp
// apps/api/Controllers/NotificacaoController.cs
using api.Models;
using api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace api.Controllers;

[Authorize(Roles = "Professor, Admin")]
[ApiController]
[Route("api/[controller]")]
public class NotificacaoController : ControllerBase
{
    private readonly NotificacaoService _service;
    private readonly UserManager<Usuario> _usuario;

    public NotificacaoController(NotificacaoService service, UserManager<Usuario> usuario)
    {
        _service = service;
        _usuario = usuario;
    }

    [HttpGet("listar")]
    public async Task<IActionResult> Listar([FromQuery] bool apenasNaoLidas = false)
    {
        var usuario = await _usuario.GetUserAsync(User);
        if (usuario == null)
            return Unauthorized();

        var resposta = await _service.ListarAsync(usuario, apenasNaoLidas);
        return resposta.Sucesso ? Ok(resposta) : BadRequest(resposta);
    }

    [HttpPost("{id:int}/marcar-lida")]
    public async Task<IActionResult> MarcarComoLida(int id)
    {
        var usuario = await _usuario.GetUserAsync(User);
        if (usuario == null)
            return Unauthorized();

        var resposta = await _service.MarcarComoLidaAsync(id, usuario);
        return resposta.Sucesso ? Ok(resposta) : BadRequest(resposta);
    }

    [HttpPost("marcar-todas-lidas")]
    public async Task<IActionResult> MarcarTodasComoLidas()
    {
        var usuario = await _usuario.GetUserAsync(User);
        if (usuario == null)
            return Unauthorized();

        var resposta = await _service.MarcarTodasComoLidasAsync(usuario);
        return resposta.Sucesso ? Ok(resposta) : BadRequest(resposta);
    }
}
```

- [ ] **Step 2: Build**

```bash
cd apps/api
dotnet build
```

Expected: build sem erro.

- [ ] **Step 3: Smoke test manual (comandos para o usuário rodar, com token de login válido)**

```bash
curl -s -H "Authorization: Bearer <TOKEN>" https://localhost:<porta>/api/Notificacao/listar | jq
```

Expected: `{"sucesso":true,"mensagens":[],"objeto":null,"listaObjetos":[]}` (lista vazia, ainda não existe worker gerando notificação).

- [ ] **Step 4: Listar arquivos alterados**

```bash
git status --short apps/api/Controllers/NotificacaoController.cs
```

---

### Task 4: Fila de geração em background (`IRelatorioGeracaoQueue` + `RelatorioGeracaoWorker`)

**Files:**
- Create: `apps/api/Services/IRelatorioGeracaoQueue.cs`
- Create: `apps/api/Services/RelatorioGeracaoQueue.cs`
- Create: `apps/api/Services/RelatorioGeracaoWorker.cs`
- Modify: `apps/api/Program.cs:206` (registrar a fila e o worker perto de `RelatorioService`)

**Interfaces:**
- Consumes: `RelatorioService.ProcessarGeracaoAsync(int relatorioId): Task` (definido na Task 5 — o worker só chama, a implementação vem depois; ordem de implementação real: Task 5/6 escrevem `ProcessarGeracaoAsync` antes deste worker rodar de verdade, mas o arquivo do worker pode ser escrito e compilar já — `RelatorioService` já existe, só falta o método).
- Produces: `IRelatorioGeracaoQueue.Enfileirar(int relatorioId): void`; `IRelatorioGeracaoQueue.ConsumirAsync(CancellationToken): IAsyncEnumerable<int>` — usado por `RelatorioService.CriarAsync`/`GerarNovamenteAsync` (Task 5/6) e pelo `RelatorioGeracaoWorker`.

- [ ] **Step 1: Criar a interface da fila**

```csharp
// apps/api/Services/IRelatorioGeracaoQueue.cs
namespace api.Services;

public interface IRelatorioGeracaoQueue
{
    void Enfileirar(int relatorioId);
    IAsyncEnumerable<int> ConsumirAsync(CancellationToken cancellationToken);
}
```

- [ ] **Step 2: Implementar a fila com `Channel<int>`**

```csharp
// apps/api/Services/RelatorioGeracaoQueue.cs
using System.Threading.Channels;

namespace api.Services;

// Fila em memória (não persistida): se a API reiniciar com itens na fila, o relatório fica
// preso em Status.Gerando — o professor tem o botão "Gerar novamente" na tela do relatório
// como caminho de recuperação manual, então não introduzimos fila durável aqui (YAGNI).
public class RelatorioGeracaoQueue : IRelatorioGeracaoQueue
{
    private readonly Channel<int> _channel = Channel.CreateUnbounded<int>();

    public void Enfileirar(int relatorioId)
    {
        _channel.Writer.TryWrite(relatorioId);
    }

    public IAsyncEnumerable<int> ConsumirAsync(CancellationToken cancellationToken)
    {
        return _channel.Reader.ReadAllAsync(cancellationToken);
    }
}
```

- [ ] **Step 3: Implementar o worker**

```csharp
// apps/api/Services/RelatorioGeracaoWorker.cs
namespace api.Services;

// Consome a fila de geração de Relatório Pedagógico e roda a chamada de IA (lenta, ~14 seções
// numa chamada só — ver RelatorioService.ProcessarGeracaoAsync) fora do ciclo de requisição
// HTTP. Mesmo padrão de scope-por-item de HotmartReconciliacaoAssinaturasJob.
public class RelatorioGeracaoWorker : BackgroundService
{
    private readonly IRelatorioGeracaoQueue _queue;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<RelatorioGeracaoWorker> _logger;

    public RelatorioGeracaoWorker(
        IRelatorioGeracaoQueue queue,
        IServiceScopeFactory scopeFactory,
        ILogger<RelatorioGeracaoWorker> logger)
    {
        _queue = queue;
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await foreach (var relatorioId in _queue.ConsumirAsync(stoppingToken))
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var relatorioService = scope.ServiceProvider.GetRequiredService<RelatorioService>();
                await relatorioService.ProcessarGeracaoAsync(relatorioId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Falha ao processar geração em background do relatório {RelatorioId}", relatorioId);
            }
        }
    }
}
```

- [ ] **Step 4: Registrar fila e worker no DI**

Em `apps/api/Program.cs`, logo abaixo de `builder.Services.AddScoped<RelatorioService>();` (linha 206), adicionar:

```csharp
builder.Services.AddSingleton<IRelatorioGeracaoQueue, RelatorioGeracaoQueue>();
builder.Services.AddHostedService<RelatorioGeracaoWorker>();
```

- [ ] **Step 5: Build**

```bash
cd apps/api
dotnet build
```

Expected: build sem erro (o worker referencia `RelatorioService.ProcessarGeracaoAsync`, que ainda não existe até a Task 5 — se este passo for executado antes da Task 5, o build falha com `CS1061`; nesse caso, escrever Task 5 antes de rodar este build, ou aceitar o erro esperado e resolver na sequência).

- [ ] **Step 6: Listar arquivos alterados**

```bash
git status --short apps/api/Services/IRelatorioGeracaoQueue.cs apps/api/Services/RelatorioGeracaoQueue.cs apps/api/Services/RelatorioGeracaoWorker.cs apps/api/Program.cs
```

---

### Task 5: Timeout explícito no `HttpClient` do Gemini

**Files:**
- Modify: `apps/api/Program.cs:217`

**Interfaces:**
- Nenhuma nova — só configuração do `HttpClient` já registrado pra `IGeradorTextoIA`.

- [ ] **Step 1: Configurar o timeout**

Em `apps/api/Program.cs`, trocar:

```csharp
builder.Services.AddHttpClient<api.Services.IA.IGeradorTextoIA, api.Services.IA.GeminiGeradorTextoIA>();
```

por:

```csharp
// Timeout explícito (default do HttpClient seria 100s) — agora que a geração roda em
// background (RelatorioGeracaoWorker), isso só limita quanto tempo o worker espera o Gemini
// antes de marcar Status.ErroGeracao, evitando ficar preso indefinidamente numa chamada travada.
builder.Services.AddHttpClient<api.Services.IA.IGeradorTextoIA, api.Services.IA.GeminiGeradorTextoIA>()
    .ConfigureHttpClient(client => client.Timeout = TimeSpan.FromSeconds(120));
```

- [ ] **Step 2: Build**

```bash
cd apps/api
dotnet build
```

Expected: build sem erro.

- [ ] **Step 3: Listar arquivos alterados**

```bash
git status --short apps/api/Program.cs
```

---

### Task 6: `RelatorioService.CriarAsync` responde na hora + `ProcessarGeracaoAsync`

**Files:**
- Modify: `apps/api/Services/RelatorioService.cs:13-35` (construtor — novas dependências)
- Modify: `apps/api/Services/RelatorioService.cs:464-521` (`CriarAsync`)
- Modify: `apps/api/Services/RelatorioService.cs` (novo método `ProcessarGeracaoAsync`, logo após `GerarSecoesAsync`, hoje terminando na linha 419)

**Interfaces:**
- Consumes: `IRelatorioGeracaoQueue.Enfileirar(int)` (Task 4); `NotificacaoService.CriarAsync(int, TipoNotificacao, string, string, int?)` (Task 2).
- Produces: `RelatorioService.ProcessarGeracaoAsync(int relatorioId): Task` — chamado pelo `RelatorioGeracaoWorker` (Task 4).

- [ ] **Step 1: Adicionar as novas dependências no construtor**

Em `apps/api/Services/RelatorioService.cs`, trocar:

```csharp
    private readonly AppDbContext _db;
    private readonly PromptSistemaIAService _promptService;
    private readonly IGeradorTextoIA _geradorTextoIA;
    private readonly GeracaoIALogService _geracaoLog;

    public RelatorioService(
        AppDbContext db,
        PromptSistemaIAService promptService,
        IGeradorTextoIA geradorTextoIA,
        GeracaoIALogService geracaoLog)
    {
        _db = db;
        _promptService = promptService;
        _geradorTextoIA = geradorTextoIA;
        _geracaoLog = geracaoLog;
    }
```

por:

```csharp
    private readonly AppDbContext _db;
    private readonly PromptSistemaIAService _promptService;
    private readonly IGeradorTextoIA _geradorTextoIA;
    private readonly GeracaoIALogService _geracaoLog;
    private readonly IRelatorioGeracaoQueue _geracaoQueue;
    private readonly NotificacaoService _notificacaoService;

    public RelatorioService(
        AppDbContext db,
        PromptSistemaIAService promptService,
        IGeradorTextoIA geradorTextoIA,
        GeracaoIALogService geracaoLog,
        IRelatorioGeracaoQueue geracaoQueue,
        NotificacaoService notificacaoService)
    {
        _db = db;
        _promptService = promptService;
        _geradorTextoIA = geradorTextoIA;
        _geracaoLog = geracaoLog;
        _geracaoQueue = geracaoQueue;
        _notificacaoService = notificacaoService;
    }
```

- [ ] **Step 2: Reescrever `CriarAsync` pra enfileirar em vez de gerar na hora**

Trocar o corpo inteiro do método (linhas 464-521):

```csharp
    public async Task<ServiceResponse<RelatorioBuscarDTO>> CriarAsync(RelatorioCadastroDTO dto, Usuario usuario)
    {
        var resposta = new ServiceResponse<RelatorioBuscarDTO>();
        var professorId = usuario.ProfessorId ?? 0;
        if (professorId == 0)
        {
            resposta.SetFalha("Professor não identificado.");
            return resposta;
        }

        if (dto.DataInicio > dto.DataFim)
        {
            resposta.SetFalha("Data inicial não pode ser posterior à final.");
            return resposta;
        }

        try
        {
            var insumos = await MontarInsumosAsync(professorId, dto.AlunoId, dto.DataInicio, dto.DataFim);
            if (insumos == null)
            {
                resposta.SetFalha("Aluno não encontrado ou sem permissão.");
                return resposta;
            }

            var relatorio = new Relatorio
            {
                AlunoId = dto.AlunoId,
                ProfessorId = professorId,
                EscolaId = insumos.Aluno.IdEscola,
                DataInicio = dto.DataInicio,
                DataFim = dto.DataFim,
                TipoPeriodo = dto.TipoPeriodo,
                Status = RelatorioStatus.Rascunho,
            };
            _db.Relatorios.Add(relatorio);
            await _db.SaveChangesAsync();

            var erro = await GerarSecoesAsync(relatorio, insumos, professorId);
            var dtoResultado = await MapToBuscarDtoAsync(relatorio.Id);

            if (erro != null)
            {
                resposta.SetFalha($"Relatório criado, mas {erro} Você pode tentar gerar novamente.");
                resposta.AdicionaObjeto(dtoResultado);
                return resposta;
            }

            resposta.AdicionaObjeto(dtoResultado);
            resposta.AdicionaMensagem("Relatório gerado. Revise as seções antes de finalizar.");
            return resposta;
        }
        catch (Exception ex)
        {
            resposta.SetFalha("Erro ao criar relatório: " + ex.Message);
            return resposta;
        }
    }
```

por:

```csharp
    public async Task<ServiceResponse<RelatorioBuscarDTO>> CriarAsync(RelatorioCadastroDTO dto, Usuario usuario)
    {
        var resposta = new ServiceResponse<RelatorioBuscarDTO>();
        var professorId = usuario.ProfessorId ?? 0;
        if (professorId == 0)
        {
            resposta.SetFalha("Professor não identificado.");
            return resposta;
        }

        if (dto.DataInicio > dto.DataFim)
        {
            resposta.SetFalha("Data inicial não pode ser posterior à final.");
            return resposta;
        }

        try
        {
            // Só valida que o aluno existe e monta os insumos pra checagem de permissão —
            // os dados de verdade pro prompt são relidos em ProcessarGeracaoAsync, já que a
            // geração roda depois, em background (podem ter mudado entre o cadastro e o
            // processamento, o que é aceitável — reflete o estado mais atual).
            var insumos = await MontarInsumosAsync(professorId, dto.AlunoId, dto.DataInicio, dto.DataFim);
            if (insumos == null)
            {
                resposta.SetFalha("Aluno não encontrado ou sem permissão.");
                return resposta;
            }

            var relatorio = new Relatorio
            {
                AlunoId = dto.AlunoId,
                ProfessorId = professorId,
                EscolaId = insumos.Aluno.IdEscola,
                DataInicio = dto.DataInicio,
                DataFim = dto.DataFim,
                TipoPeriodo = dto.TipoPeriodo,
                Status = RelatorioStatus.Gerando,
            };
            _db.Relatorios.Add(relatorio);
            await _db.SaveChangesAsync();

            _geracaoQueue.Enfileirar(relatorio.Id);

            var dtoResultado = await MapToBuscarDtoAsync(relatorio.Id);
            resposta.AdicionaObjeto(dtoResultado);
            resposta.AdicionaMensagem("Relatório em geração. Você será avisado quando estiver pronto.");
            return resposta;
        }
        catch (Exception ex)
        {
            resposta.SetFalha("Erro ao criar relatório: " + ex.Message);
            return resposta;
        }
    }
```

- [ ] **Step 3: Adicionar `ProcessarGeracaoAsync`**

Logo após o fechamento de `GerarSecoesAsync` (hoje linha 419, antes de `private async Task<RelatorioBuscarDTO> MapToBuscarDtoAsync`), adicionar:

```csharp
    // Chamado pelo RelatorioGeracaoWorker, fora do ciclo de requisição HTTP — é aqui que a
    // chamada lenta de IA (14 seções numa chamada só) realmente acontece.
    public async Task ProcessarGeracaoAsync(int relatorioId)
    {
        var relatorio = await _db.Relatorios
            .Include(r => r.Aluno)
            .FirstOrDefaultAsync(r => r.Id == relatorioId);
        if (relatorio == null) return;

        var alunoNome = relatorio.Aluno?.NomeCompleto ?? "aluno";

        var insumos = await MontarInsumosAsync(relatorio.ProfessorId, relatorio.AlunoId, relatorio.DataInicio, relatorio.DataFim);
        if (insumos == null)
        {
            relatorio.Status = RelatorioStatus.ErroGeracao;
            relatorio.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            await _notificacaoService.CriarAsync(
                relatorio.ProfessorId,
                TipoNotificacao.RelatorioComErro,
                "Falha ao gerar relatório",
                $"Não foi possível gerar o relatório de {alunoNome}: aluno não encontrado ou sem permissão.",
                relatorio.Id);
            return;
        }

        var erro = await GerarSecoesAsync(relatorio, insumos, relatorio.ProfessorId);
        relatorio.Status = erro != null ? RelatorioStatus.ErroGeracao : RelatorioStatus.Rascunho;
        relatorio.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        if (erro != null)
        {
            await _notificacaoService.CriarAsync(
                relatorio.ProfessorId,
                TipoNotificacao.RelatorioComErro,
                "Falha ao gerar relatório",
                $"O relatório de {alunoNome} teve um problema na geração: {erro}",
                relatorio.Id);
        }
        else
        {
            await _notificacaoService.CriarAsync(
                relatorio.ProfessorId,
                TipoNotificacao.RelatorioGerado,
                "Relatório pronto",
                $"O relatório pedagógico de {alunoNome} foi gerado e está pronto para revisão.",
                relatorio.Id);
        }
    }
```

- [ ] **Step 4: Build**

```bash
cd apps/api
dotnet build
```

Expected: build sem erro. Se a Task 4 já foi implementada antes desta, o erro `CS1061` de `ProcessarGeracaoAsync` não encontrado deve ter sumido.

- [ ] **Step 5: Smoke test manual (comandos para o usuário rodar)**

```bash
curl -s -X POST -H "Authorization: Bearer <TOKEN>" -H "Content-Type: application/json" \
  -d '{"alunoId": <ID_ALUNO>, "dataInicio": "2026-01-01", "dataFim": "2026-09-02", "tipoPeriodo": 1}' \
  https://localhost:<porta>/api/Relatorio/cadastro | jq
```

Expected: resposta em menos de ~1-2s (não mais 15-30s), `objeto.status: 2` (Gerando), `mensagens: ["Relatório em geração. Você será avisado quando estiver pronto."]`. Esperar alguns segundos e checar `GET /api/Relatorio/{id}` — `status` deve virar `0` (Rascunho, com seções preenchidas) ou `3` (ErroGeracao); `GET /api/Notificacao/listar` deve trazer a notificação correspondente.

- [ ] **Step 6: Listar arquivos alterados**

```bash
git status --short apps/api/Services/RelatorioService.cs
```

---

### Task 7: `RelatorioService.GerarNovamenteAsync` usa a mesma fila

**Files:**
- Modify: `apps/api/Services/RelatorioService.cs:523-575` (`GerarNovamenteAsync`)

**Interfaces:**
- Consumes: `IRelatorioGeracaoQueue.Enfileirar(int)` (já injetado na Task 6).

- [ ] **Step 1: Reescrever `GerarNovamenteAsync`**

Trocar o corpo inteiro do método (linhas 523-575):

```csharp
    public async Task<ServiceResponse<RelatorioBuscarDTO>> GerarNovamenteAsync(int id, Usuario usuario)
    {
        var resposta = new ServiceResponse<RelatorioBuscarDTO>();
        var professorId = usuario.ProfessorId ?? 0;
        if (professorId == 0)
        {
            resposta.SetFalha("Professor não identificado.");
            return resposta;
        }

        var relatorio = await _db.Relatorios.FirstOrDefaultAsync(r => r.Id == id && r.ProfessorId == professorId);
        if (relatorio == null)
        {
            resposta.SetFalha("Relatório não encontrado.");
            return resposta;
        }

        var jaTemSecoes = await _db.RelatorioSecoes.AnyAsync(s => s.RelatorioId == id);
        if (jaTemSecoes)
        {
            resposta.SetFalha("Este relatório já foi gerado — edite as seções manualmente.");
            return resposta;
        }

        try
        {
            var insumos = await MontarInsumosAsync(professorId, relatorio.AlunoId, relatorio.DataInicio, relatorio.DataFim);
            if (insumos == null)
            {
                resposta.SetFalha("Aluno não encontrado ou sem permissão.");
                return resposta;
            }

            var erro = await GerarSecoesAsync(relatorio, insumos, professorId);
            var dtoResultado = await MapToBuscarDtoAsync(id);

            if (erro != null)
            {
                resposta.SetFalha(erro);
                resposta.AdicionaObjeto(dtoResultado);
                return resposta;
            }

            resposta.AdicionaObjeto(dtoResultado);
            resposta.AdicionaMensagem("Relatório gerado. Revise as seções antes de finalizar.");
            return resposta;
        }
        catch (Exception ex)
        {
            resposta.SetFalha("Erro ao gerar relatório: " + ex.Message);
            return resposta;
        }
    }
```

por:

```csharp
    public async Task<ServiceResponse<RelatorioBuscarDTO>> GerarNovamenteAsync(int id, Usuario usuario)
    {
        var resposta = new ServiceResponse<RelatorioBuscarDTO>();
        var professorId = usuario.ProfessorId ?? 0;
        if (professorId == 0)
        {
            resposta.SetFalha("Professor não identificado.");
            return resposta;
        }

        var relatorio = await _db.Relatorios.FirstOrDefaultAsync(r => r.Id == id && r.ProfessorId == professorId);
        if (relatorio == null)
        {
            resposta.SetFalha("Relatório não encontrado.");
            return resposta;
        }

        var jaTemSecoes = await _db.RelatorioSecoes.AnyAsync(s => s.RelatorioId == id);
        if (jaTemSecoes)
        {
            resposta.SetFalha("Este relatório já foi gerado — edite as seções manualmente.");
            return resposta;
        }

        if (relatorio.Status == RelatorioStatus.Gerando)
        {
            resposta.SetFalha("Este relatório já está sendo gerado.");
            return resposta;
        }

        relatorio.Status = RelatorioStatus.Gerando;
        relatorio.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        _geracaoQueue.Enfileirar(relatorio.Id);

        var dtoResultado = await MapToBuscarDtoAsync(id);
        resposta.AdicionaObjeto(dtoResultado);
        resposta.AdicionaMensagem("Relatório em geração. Você será avisado quando estiver pronto.");
        return resposta;
    }
```

- [ ] **Step 2: Build**

```bash
cd apps/api
dotnet build
```

Expected: build sem erro.

- [ ] **Step 3: Smoke test manual — regeração concorrente (comando para o usuário rodar)**

Chamar `POST /api/Relatorio/{id}/gerar-novamente` duas vezes seguidas rápido pro mesmo relatório (`id` com 0 seções): a 1ª deve retornar `sucesso: true` com `status: 2`; a 2ª (antes do worker terminar) deve retornar `sucesso: false`, mensagem "Este relatório já está sendo gerado."

- [ ] **Step 4: Listar arquivos alterados**

```bash
git status --short apps/api/Services/RelatorioService.cs
```

---

### Task 8: Frontend — tipos de status e badge

**Files:**
- Modify: `apps/web-app/src/types/relatorio.ts:11-17`

**Interfaces:**
- Produces: `RelatorioStatusCodigo = 0 | 1 | 2 | 3`; `RELATORIO_STATUS_LABELS: Record<RelatorioStatusCodigo, string>`; `RELATORIO_STATUS_BADGE_VARIANT: Record<RelatorioStatusCodigo, 'amber' | 'success' | 'default' | 'danger'>` — consumido por `RelatorioDetailPage.tsx` (Task 14) e `RelatoriosPage.tsx` (Task 15).

- [ ] **Step 1: Estender os tipos e labels de status**

Em `apps/web-app/src/types/relatorio.ts`, trocar:

```ts
/** Alinhado ao enum `RelatorioStatus` da API. */
export type RelatorioStatusCodigo = 0 | 1

export const RELATORIO_STATUS_LABELS: Record<RelatorioStatusCodigo, string> = {
  0: 'Rascunho',
  1: 'Finalizado',
}
```

por:

```ts
/** Alinhado ao enum `RelatorioStatus` da API. */
export type RelatorioStatusCodigo = 0 | 1 | 2 | 3

export const RELATORIO_STATUS_LABELS: Record<RelatorioStatusCodigo, string> = {
  0: 'Rascunho',
  1: 'Finalizado',
  2: 'Gerando',
  3: 'Erro na geração',
}

export const RELATORIO_STATUS_BADGE_VARIANT: Record<RelatorioStatusCodigo, 'amber' | 'success' | 'default' | 'danger'> = {
  0: 'amber',
  1: 'success',
  2: 'default',
  3: 'danger',
}
```

- [ ] **Step 2: Rodar a suíte de testes de tipos/serviço existente (não deve quebrar)**

```bash
cd apps/web-app
npx vitest run src/services/relatorioService.test.ts
```

Expected: PASS (esse arquivo não usa os status novos, só confirma que nada quebrou).

- [ ] **Step 3: Listar arquivos alterados**

```bash
git status --short apps/web-app/src/types/relatorio.ts
```

---

### Task 9: Frontend — `notificacaoService.ts` (TDD)

**Files:**
- Create: `apps/web-app/src/types/notificacao.ts`
- Create: `apps/web-app/src/services/notificacaoService.ts`
- Test: `apps/web-app/src/services/notificacaoService.test.ts`

**Interfaces:**
- Consumes: `api` de `@/api/http` (mesmo cliente axios de `relatorioService.ts`).
- Produces: `Notificacao { id: number, tipo: 0 | 1, titulo: string, mensagem: string, relatorioId: number | null, lida: boolean, createdAt: string }`; `listarNotificacoes(params?: { apenasNaoLidas?: boolean }): Promise<Notificacao[]>`; `marcarNotificacaoComoLida(id: number): Promise<void>`; `marcarTodasNotificacoesComoLidas(): Promise<void>` — consumidos por `useNotificacoes` (Task 10).

- [ ] **Step 1: Criar os tipos**

```ts
// apps/web-app/src/types/notificacao.ts

/** Alinhado ao enum `TipoNotificacao` da API. */
export type NotificacaoTipoCodigo = 0 | 1

export interface Notificacao {
  id: number
  tipo: NotificacaoTipoCodigo
  titulo: string
  mensagem: string
  relatorioId: number | null
  lida: boolean
  createdAt: string
}

export interface NotificacaoResponse {
  sucesso: boolean
  mensagens: string[]
  objeto: Notificacao | null
  listaObjetos: Notificacao[]
}
```

- [ ] **Step 2: Escrever o teste do service (falhando — o service ainda não existe)**

```ts
// apps/web-app/src/services/notificacaoService.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  listarNotificacoes,
  marcarNotificacaoComoLida,
  marcarTodasNotificacoesComoLidas,
} from './notificacaoService'
import { api } from '@/api/http'

vi.mock('@/api/http', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

describe('notificacaoService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('listarNotificacoes', () => {
    it('retorna a lista quando a API responde com sucesso', async () => {
      vi.mocked(api.get).mockResolvedValue({
        data: {
          sucesso: true,
          listaObjetos: [
            { id: 1, tipo: 0, titulo: 'Relatório pronto', mensagem: 'msg', relatorioId: 5, lida: false, createdAt: '2026-09-02T10:00:00Z' },
          ],
        },
      })

      const result = await listarNotificacoes({ apenasNaoLidas: true })

      expect(result).toHaveLength(1)
      expect(api.get).toHaveBeenCalledWith('/Notificacao/listar', { params: { apenasNaoLidas: true } })
    })

    it('retorna array vazio quando não há notificações', async () => {
      vi.mocked(api.get).mockResolvedValue({ data: { sucesso: true, listaObjetos: [] } })

      const result = await listarNotificacoes()

      expect(result).toEqual([])
    })

    it('lança erro quando API retorna falha', async () => {
      vi.mocked(api.get).mockResolvedValue({
        data: { sucesso: false, mensagens: ['Professor não identificado.'] },
      })

      await expect(listarNotificacoes()).rejects.toThrow('Professor não identificado.')
    })
  })

  describe('marcarNotificacaoComoLida', () => {
    it('chama o endpoint correto', async () => {
      vi.mocked(api.post).mockResolvedValue({ data: { sucesso: true } })

      await marcarNotificacaoComoLida(7)

      expect(api.post).toHaveBeenCalledWith('/Notificacao/7/marcar-lida')
    })

    it('lança erro quando API retorna falha', async () => {
      vi.mocked(api.post).mockResolvedValue({ data: { sucesso: false, mensagens: ['Notificação não encontrada.'] } })

      await expect(marcarNotificacaoComoLida(7)).rejects.toThrow('Notificação não encontrada.')
    })
  })

  describe('marcarTodasNotificacoesComoLidas', () => {
    it('chama o endpoint correto', async () => {
      vi.mocked(api.post).mockResolvedValue({ data: { sucesso: true } })

      await marcarTodasNotificacoesComoLidas()

      expect(api.post).toHaveBeenCalledWith('/Notificacao/marcar-todas-lidas')
    })
  })
})
```

- [ ] **Step 3: Rodar e confirmar que falha**

```bash
cd apps/web-app
npx vitest run src/services/notificacaoService.test.ts
```

Expected: FAIL — `Failed to resolve import "./notificacaoService"`.

- [ ] **Step 4: Implementar o service**

```ts
// apps/web-app/src/services/notificacaoService.ts
import { api } from '@/api/http'
import type { Notificacao, NotificacaoResponse } from '@/types/notificacao'

export const listarNotificacoes = async (params: { apenasNaoLidas?: boolean } = {}): Promise<Notificacao[]> => {
  const response = await api.get<NotificacaoResponse>('/Notificacao/listar', { params })
  if (response.data.sucesso) return response.data.listaObjetos ?? []
  throw new Error(response.data.mensagens?.join(', ') || 'Falha ao listar notificações')
}

export const marcarNotificacaoComoLida = async (id: number): Promise<void> => {
  const response = await api.post<NotificacaoResponse>(`/Notificacao/${id}/marcar-lida`)
  if (!response.data.sucesso) {
    throw new Error(response.data.mensagens?.join(', ') || 'Falha ao marcar notificação como lida')
  }
}

export const marcarTodasNotificacoesComoLidas = async (): Promise<void> => {
  const response = await api.post<NotificacaoResponse>('/Notificacao/marcar-todas-lidas')
  if (!response.data.sucesso) {
    throw new Error(response.data.mensagens?.join(', ') || 'Falha ao marcar notificações como lidas')
  }
}
```

- [ ] **Step 5: Rodar e confirmar que passa**

```bash
cd apps/web-app
npx vitest run src/services/notificacaoService.test.ts
```

Expected: PASS (7 testes).

- [ ] **Step 6: Listar arquivos alterados**

```bash
git status --short apps/web-app/src/types/notificacao.ts apps/web-app/src/services/notificacaoService.ts apps/web-app/src/services/notificacaoService.test.ts
```

---

### Task 10: Frontend — `useNotificacoes` (TDD)

**Files:**
- Create: `apps/web-app/src/hooks/useNotificacoes.ts`
- Test: `apps/web-app/src/hooks/useNotificacoes.test.tsx`

**Interfaces:**
- Consumes: `listarNotificacoes`, `marcarNotificacaoComoLida`, `marcarTodasNotificacoesComoLidas` (Task 9); `PageWrapper`/`createTestQueryClient` de `@/test/page-test-utils` (só no teste).
- Produces: `useNotificacoes(): { notificacoes: Notificacao[], naoLidas: Notificacao[], totalNaoLidas: number, marcarComoLida: (id: number) => void, marcarTodasComoLidas: () => void }` — consumido por `NotificationBell` (Task 11).

- [ ] **Step 1: Escrever o teste do hook (falhando)**

```tsx
// apps/web-app/src/hooks/useNotificacoes.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useNotificacoes } from './useNotificacoes'
import * as notificacaoService from '@/services/notificacaoService'
import { PageWrapper } from '@/test/page-test-utils'
import type { Notificacao } from '@/types/notificacao'

vi.mock('@/services/notificacaoService')

const NOTIFICACAO_LIDA: Notificacao = {
  id: 1,
  tipo: 0,
  titulo: 'Relatório pronto',
  mensagem: 'msg',
  relatorioId: 5,
  lida: true,
  createdAt: '2026-09-02T09:00:00Z',
}

const NOTIFICACAO_NAO_LIDA: Notificacao = {
  id: 2,
  tipo: 0,
  titulo: 'Relatório pronto',
  mensagem: 'msg',
  relatorioId: 6,
  lida: false,
  createdAt: '2026-09-02T10:00:00Z',
}

describe('useNotificacoes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calcula totalNaoLidas a partir da lista', async () => {
    vi.mocked(notificacaoService.listarNotificacoes).mockResolvedValue([NOTIFICACAO_LIDA, NOTIFICACAO_NAO_LIDA])

    const { result } = renderHook(() => useNotificacoes(), { wrapper: PageWrapper })

    await waitFor(() => expect(result.current.notificacoes).toHaveLength(2))
    expect(result.current.totalNaoLidas).toBe(1)
    expect(result.current.naoLidas).toEqual([NOTIFICACAO_NAO_LIDA])
  })

  it('marcarComoLida chama o service com o id certo', async () => {
    vi.mocked(notificacaoService.listarNotificacoes).mockResolvedValue([NOTIFICACAO_NAO_LIDA])
    vi.mocked(notificacaoService.marcarNotificacaoComoLida).mockResolvedValue(undefined)

    const { result } = renderHook(() => useNotificacoes(), { wrapper: PageWrapper })
    await waitFor(() => expect(result.current.notificacoes).toHaveLength(1))

    result.current.marcarComoLida(2)

    await waitFor(() => expect(notificacaoService.marcarNotificacaoComoLida).toHaveBeenCalledWith(2))
  })
})
```

- [ ] **Step 2: Rodar e confirmar que falha**

```bash
cd apps/web-app
npx vitest run src/hooks/useNotificacoes.test.tsx
```

Expected: FAIL — `Failed to resolve import "./useNotificacoes"`.

- [ ] **Step 3: Implementar o hook**

```ts
// apps/web-app/src/hooks/useNotificacoes.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  listarNotificacoes,
  marcarNotificacaoComoLida,
  marcarTodasNotificacoesComoLidas,
} from '@/services/notificacaoService'

const POLL_INTERVAL_MS = 20_000

export function useNotificacoes() {
  const qc = useQueryClient()

  const { data: notificacoes = [] } = useQuery({
    queryKey: ['notificacoes'],
    queryFn: () => listarNotificacoes(),
    refetchInterval: POLL_INTERVAL_MS,
  })

  const naoLidas = notificacoes.filter((n) => !n.lida)

  const marcarComoLidaMutation = useMutation({
    mutationFn: marcarNotificacaoComoLida,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notificacoes'] }),
  })

  const marcarTodasComoLidasMutation = useMutation({
    mutationFn: marcarTodasNotificacoesComoLidas,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notificacoes'] }),
  })

  return {
    notificacoes,
    naoLidas,
    totalNaoLidas: naoLidas.length,
    marcarComoLida: marcarComoLidaMutation.mutate,
    marcarTodasComoLidas: marcarTodasComoLidasMutation.mutate,
  }
}
```

- [ ] **Step 4: Rodar e confirmar que passa**

```bash
cd apps/web-app
npx vitest run src/hooks/useNotificacoes.test.tsx
```

Expected: PASS (2 testes).

- [ ] **Step 5: Listar arquivos alterados**

```bash
git status --short apps/web-app/src/hooks/useNotificacoes.ts apps/web-app/src/hooks/useNotificacoes.test.tsx
```

---

### Task 11: Frontend — `NotificationBell` (TDD)

**Files:**
- Create: `apps/web-app/src/components/notifications/NotificationBell.tsx`
- Test: `apps/web-app/src/components/notifications/NotificationBell.test.tsx`

**Interfaces:**
- Consumes: `useNotificacoes` (Task 10); `DropdownMenu`/`DropdownMenuContent`/`DropdownMenuItem`/`DropdownMenuLabel`/`DropdownMenuSeparator`/`DropdownMenuTrigger` de `@/components/ui/dropdown-menu`; `Button` de `@/components/ui/button`; `Bell` de `@phosphor-icons/react`; `useNavigate` de `react-router-dom`.
- Produces: `NotificationBell(): JSX.Element` — consumido por `Sidebar.tsx` (Task 12).

- [ ] **Step 1: Escrever o teste do componente (falhando)**

```tsx
// apps/web-app/src/components/notifications/NotificationBell.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderPage } from '@/test/page-test-utils'
import { NotificationBell } from './NotificationBell'
import * as notificacaoService from '@/services/notificacaoService'
import type { Notificacao } from '@/types/notificacao'

vi.mock('@/services/notificacaoService')

const NOTIFICACAO_NAO_LIDA: Notificacao = {
  id: 1,
  tipo: 0,
  titulo: 'Relatório pronto',
  mensagem: 'O relatório de Beatriz foi gerado.',
  relatorioId: 5,
  lida: false,
  createdAt: '2026-09-02T10:00:00Z',
}

describe('NotificationBell', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('não mostra contagem quando não há notificações', async () => {
    vi.mocked(notificacaoService.listarNotificacoes).mockResolvedValue([])

    renderPage(<NotificationBell />)

    await waitFor(() => expect(notificacaoService.listarNotificacoes).toHaveBeenCalled())
    expect(screen.queryByTestId('notification-badge')).not.toBeInTheDocument()
  })

  it('mostra a contagem de notificações não lidas', async () => {
    vi.mocked(notificacaoService.listarNotificacoes).mockResolvedValue([NOTIFICACAO_NAO_LIDA])

    renderPage(<NotificationBell />)

    expect(await screen.findByTestId('notification-badge')).toHaveTextContent('1')
  })

  it('ao clicar numa notificação, marca como lida', async () => {
    const user = userEvent.setup()
    vi.mocked(notificacaoService.listarNotificacoes).mockResolvedValue([NOTIFICACAO_NAO_LIDA])
    vi.mocked(notificacaoService.marcarNotificacaoComoLida).mockResolvedValue(undefined)

    renderPage(<NotificationBell />)

    await screen.findByTestId('notification-badge')
    await user.click(screen.getByRole('button', { name: 'Notificações' }))
    await user.click(await screen.findByText('Relatório pronto'))

    expect(notificacaoService.marcarNotificacaoComoLida).toHaveBeenCalledWith(1)
  })
})
```

- [ ] **Step 2: Rodar e confirmar que falha**

```bash
cd apps/web-app
npx vitest run src/components/notifications/NotificationBell.test.tsx
```

Expected: FAIL — `Failed to resolve import "./NotificationBell"`.

- [ ] **Step 3: Implementar o componente**

```tsx
// apps/web-app/src/components/notifications/NotificationBell.tsx
import { useNavigate } from 'react-router-dom'
import { Bell } from '@phosphor-icons/react'
import dayjs from 'dayjs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { useNotificacoes } from '@/hooks/useNotificacoes'
import type { Notificacao } from '@/types/notificacao'

export function NotificationBell() {
  const navigate = useNavigate()
  const { notificacoes, totalNaoLidas, marcarComoLida, marcarTodasComoLidas } = useNotificacoes()

  const handleSelecionar = (notificacao: Notificacao) => {
    if (!notificacao.lida) marcarComoLida(notificacao.id)
    if (notificacao.relatorioId) navigate(`/relatorios/${notificacao.relatorioId}`)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Notificações" className="relative">
          <Bell size={20} />
          {totalNaoLidas > 0 && (
            <span
              data-testid="notification-badge"
              className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white"
            >
              {totalNaoLidas > 9 ? '9+' : totalNaoLidas}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-3 py-1.5">
          <DropdownMenuLabel className="p-0">Notificações</DropdownMenuLabel>
          {totalNaoLidas > 0 && (
            <button
              type="button"
              className="text-xs font-semibold text-primary hover:underline cursor-pointer"
              onClick={() => marcarTodasComoLidas()}
            >
              Marcar todas como lidas
            </button>
          )}
        </div>
        <DropdownMenuSeparator />
        {notificacoes.length === 0 ? (
          <p className="px-3 py-4 text-center text-sm text-muted-foreground">Nenhuma notificação por aqui.</p>
        ) : (
          <div className="max-h-80 overflow-y-auto">
            {notificacoes.map((n) => (
              <DropdownMenuItem
                key={n.id}
                onSelect={() => handleSelecionar(n)}
                className="flex flex-col items-start gap-0.5 whitespace-normal"
              >
                <span className={`text-sm font-semibold ${n.lida ? 'text-muted-foreground' : 'text-foreground'}`}>
                  {n.titulo}
                </span>
                <span className="text-xs text-muted-foreground">{n.mensagem}</span>
                <span className="text-[10px] text-muted-foreground">{dayjs(n.createdAt).format('DD/MM HH:mm')}</span>
              </DropdownMenuItem>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

- [ ] **Step 4: Rodar e confirmar que passa**

```bash
cd apps/web-app
npx vitest run src/components/notifications/NotificationBell.test.tsx
```

Expected: PASS (3 testes).

- [ ] **Step 5: Listar arquivos alterados**

```bash
git status --short apps/web-app/src/components/notifications/
```

---

### Task 12: Frontend — sino na `Sidebar`

**Files:**
- Modify: `apps/web-app/src/components/layout/Sidebar.tsx:1-27` (imports)
- Modify: `apps/web-app/src/components/layout/Sidebar.tsx:102-113` (cabeçalho desktop)
- Modify: `apps/web-app/src/components/layout/Sidebar.tsx:209-222` (topo mobile)

**Interfaces:**
- Consumes: `NotificationBell` (Task 11).

- [ ] **Step 1: Importar o componente**

Em `apps/web-app/src/components/layout/Sidebar.tsx`, adicionar ao bloco de imports (junto dos outros de `@/components`):

```tsx
import { NotificationBell } from '@/components/notifications/NotificationBell'
```

- [ ] **Step 2: Colocar o sino no cabeçalho desktop**

Trocar:

```tsx
      <NavLink
        id={withTourAnchors ? 'tour-sidebar-brand' : undefined}
        to="/dashboard"
        className="flex items-center gap-2.5 px-4 py-4 border-b border-border hover:bg-primary-light transition-colors duration-150"
        aria-label="Ir para o dashboard"
      >
        <img src="/favicon.png" alt="" aria-hidden className="h-7 w-7 object-contain shrink-0" />
        <div className="leading-none">
          <span className="text-primary font-black text-base tracking-tight block">Plural</span>
          <span className="text-brand-purple text-[8px] font-semibold tracking-widest uppercase">Plataforma</span>
        </div>
      </NavLink>
```

por:

```tsx
      <div className="flex items-center justify-between border-b border-border px-4 py-4">
        <NavLink
          id={withTourAnchors ? 'tour-sidebar-brand' : undefined}
          to="/dashboard"
          className="flex items-center gap-2.5 hover:opacity-80 transition-opacity duration-150"
          aria-label="Ir para o dashboard"
        >
          <img src="/favicon.png" alt="" aria-hidden className="h-7 w-7 object-contain shrink-0" />
          <div className="leading-none">
            <span className="text-primary font-black text-base tracking-tight block">Plural</span>
            <span className="text-brand-purple text-[8px] font-semibold tracking-widest uppercase">Plataforma</span>
          </div>
        </NavLink>
        <NotificationBell />
      </div>
```

- [ ] **Step 3: Colocar o sino na barra mobile**

Trocar:

```tsx
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 h-14 flex items-center justify-between px-4 bg-card border-b border-border">
        <NavLink to="/dashboard" className="flex items-center gap-2" aria-label="Ir para o dashboard">
          <img src="/favicon.png" alt="" aria-hidden className="h-6 w-6 object-contain" />
          <span className="text-primary font-black text-base tracking-tight">Plural</span>
        </NavLink>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileOpen(true)}
          aria-label="Abrir menu"
        >
          <List size={22} />
        </Button>
      </div>
```

por:

```tsx
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 h-14 flex items-center justify-between px-4 bg-card border-b border-border">
        <NavLink to="/dashboard" className="flex items-center gap-2" aria-label="Ir para o dashboard">
          <img src="/favicon.png" alt="" aria-hidden className="h-6 w-6 object-contain" />
          <span className="text-primary font-black text-base tracking-tight">Plural</span>
        </NavLink>
        <div className="flex items-center gap-1">
          <NotificationBell />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(true)}
            aria-label="Abrir menu"
          >
            <List size={22} />
          </Button>
        </div>
      </div>
```

- [ ] **Step 4: Rodar a suíte de testes do Sidebar (não deve quebrar)**

```bash
cd apps/web-app
npx vitest run src/components/layout/Sidebar.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Listar arquivos alterados**

```bash
git status --short apps/web-app/src/components/layout/Sidebar.tsx
```

---

### Task 13: Frontend — `RelatorioStep4Geracao` reflete a resposta rápida

**Files:**
- Modify: `apps/web-app/src/pages/relatorio/steps/RelatorioStep4Geracao.tsx`

**Interfaces:**
- Nenhuma nova — só ajuste de texto/UX, a assinatura de `cadastrarRelatorio` não muda.

- [ ] **Step 1: Atualizar o texto de sucesso e o spinner**

Trocar:

```tsx
  const gerarMutation = useMutation({
    mutationFn: () => cadastrarRelatorio({ alunoId: alunoId!, dataInicio, dataFim, tipoPeriodo }),
    onSuccess: (resultado) => {
      if (resultado.sucesso) {
        success('Relatório gerado', 'Revise as seções antes de finalizar.')
      } else {
        showError('Relatório criado com pendência', resultado.mensagem)
      }
      navigate(`/relatorios/${resultado.relatorio.id}`)
    },
```

por:

```tsx
  const gerarMutation = useMutation({
    mutationFn: () => cadastrarRelatorio({ alunoId: alunoId!, dataInicio, dataFim, tipoPeriodo }),
    onSuccess: (resultado) => {
      if (resultado.sucesso) {
        success('Relatório em geração', 'Você será avisado por notificação quando estiver pronto.')
      } else {
        showError('Relatório criado com pendência', resultado.mensagem)
      }
      navigate(`/relatorios/${resultado.relatorio.id}`)
    },
```

E trocar:

```tsx
          <p className="text-sm text-muted-foreground">
            A Plural está analisando os registros do período e organizando o relatório
            pedagógico.
          </p>
```

por:

```tsx
          <p className="text-sm text-muted-foreground">
            Enviando os dados para gerar o relatório pedagógico…
          </p>
```

- [ ] **Step 2: Rodar a suíte de testes de páginas relacionadas (se existir)**

```bash
cd apps/web-app
npx vitest run src/pages/relatorio
```

Expected: PASS (arquivo não tem teste dedicado hoje — comando roda o que existir na pasta sem quebrar).

- [ ] **Step 3: Listar arquivos alterados**

```bash
git status --short apps/web-app/src/pages/relatorio/steps/RelatorioStep4Geracao.tsx
```

---

### Task 14: Frontend — `RelatorioDetailPage` com estado "Gerando" e polling

**Files:**
- Modify: `apps/web-app/src/pages/relatorio/RelatorioDetailPage.tsx`

**Interfaces:**
- Consumes: `RELATORIO_STATUS_BADGE_VARIANT` (Task 8).

- [ ] **Step 1: Importar a variante de badge por status**

Trocar:

```tsx
import {
  RELATORIO_SECAO_LABELS,
  RELATORIO_SECAO_NUMERO,
  RELATORIO_SECAO_ORDEM,
  RELATORIO_STATUS_LABELS,
  RELATORIO_TIPO_PERIODO_LABELS,
  type RelatorioSecaoChaveCodigo,
} from '@/types/relatorio'
```

por:

```tsx
import {
  RELATORIO_SECAO_LABELS,
  RELATORIO_SECAO_NUMERO,
  RELATORIO_SECAO_ORDEM,
  RELATORIO_STATUS_BADGE_VARIANT,
  RELATORIO_STATUS_LABELS,
  RELATORIO_TIPO_PERIODO_LABELS,
  type RelatorioSecaoChaveCodigo,
} from '@/types/relatorio'
```

- [ ] **Step 2: Fazer polling enquanto o status for `Gerando`**

Trocar:

```tsx
  const { data: relatorio, isLoading } = useQuery({
    queryKey: ['relatorio', id],
    queryFn: () => buscarRelatorioPorId(Number(id)),
    enabled: !!id,
  })
```

por:

```tsx
  const { data: relatorio, isLoading } = useQuery({
    queryKey: ['relatorio', id],
    queryFn: () => buscarRelatorioPorId(Number(id)),
    enabled: !!id,
    refetchInterval: (query) => (query.state.data?.status === 2 ? 5000 : false),
  })
```

- [ ] **Step 3: Atualizar o texto de sucesso de `gerarNovamenteMutation`**

Trocar:

```tsx
  const gerarNovamenteMutation = useMutation({
    mutationFn: () => gerarNovamenteRelatorio(Number(id)),
    onSuccess: (resultado) => {
      if (resultado.sucesso) {
        success('Relatório gerado', 'Revise as seções antes de finalizar.')
      } else {
        showError('Geração com pendência', resultado.mensagem)
      }
      invalidate()
    },
```

por:

```tsx
  const gerarNovamenteMutation = useMutation({
    mutationFn: () => gerarNovamenteRelatorio(Number(id)),
    onSuccess: (resultado) => {
      if (resultado.sucesso) {
        success('Relatório em geração', 'Você será avisado por notificação quando estiver pronto.')
      } else {
        showError('Geração com pendência', resultado.mensagem)
      }
      invalidate()
    },
```

- [ ] **Step 4: Distinguir Gerando / ErroGeracao / sem seções na renderização**

Trocar:

```tsx
  const finalizado = relatorio.status === 1
  const secoesPorChave = new Map(relatorio.secoes.map((s) => [s.secaoChave, s]))
  const semSecoes = relatorio.secoes.length === 0
```

por:

```tsx
  const finalizado = relatorio.status === 1
  const gerando = relatorio.status === 2
  const erroGeracao = relatorio.status === 3
  const secoesPorChave = new Map(relatorio.secoes.map((s) => [s.secaoChave, s]))
  const semSecoes = relatorio.secoes.length === 0
```

Trocar o badge de status:

```tsx
            <Badge variant={finalizado ? 'success' : 'amber'}>{RELATORIO_STATUS_LABELS[relatorio.status]}</Badge>
```

por:

```tsx
            <Badge variant={RELATORIO_STATUS_BADGE_VARIANT[relatorio.status]}>{RELATORIO_STATUS_LABELS[relatorio.status]}</Badge>
```

Trocar o bloco de conteúdo (`{semSecoes ? (...) : (...)}`):

```tsx
      {semSecoes ? (
        <Card>
          <CardContent className="pt-5 space-y-3">
            <div className="flex items-center gap-2 text-danger">
              <Warning size={18} />
              <p className="text-sm font-semibold">A geração por IA ainda não foi concluída para este relatório.</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              loading={gerarNovamenteMutation.isPending}
              onClick={() => gerarNovamenteMutation.mutate()}
            >
              <ArrowClockwise size={14} />
              Gerar novamente
            </Button>
          </CardContent>
        </Card>
      ) : (
```

por:

```tsx
      {gerando ? (
        <Card>
          <CardContent className="pt-5 flex flex-col items-center gap-3 text-center">
            <span className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
            <p className="text-sm text-muted-foreground">
              A Plural está gerando este relatório em segundo plano. Você pode sair desta tela —
              avisamos por notificação quando estiver pronto.
            </p>
          </CardContent>
        </Card>
      ) : semSecoes ? (
        <Card>
          <CardContent className="pt-5 space-y-3">
            <div className="flex items-center gap-2 text-danger">
              <Warning size={18} />
              <p className="text-sm font-semibold">
                {erroGeracao
                  ? 'A geração por IA deste relatório falhou.'
                  : 'A geração por IA ainda não foi concluída para este relatório.'}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              loading={gerarNovamenteMutation.isPending}
              onClick={() => gerarNovamenteMutation.mutate()}
            >
              <ArrowClockwise size={14} />
              Gerar novamente
            </Button>
          </CardContent>
        </Card>
      ) : (
```

- [ ] **Step 5: Rodar os testes do arquivo (se existir) e garantir type-check**

```bash
cd apps/web-app
npx vitest run src/pages/relatorio
npx tsc --noEmit
```

Expected: PASS / sem erro de tipo.

- [ ] **Step 6: Listar arquivos alterados**

```bash
git status --short apps/web-app/src/pages/relatorio/RelatorioDetailPage.tsx
```

---

### Task 15: Frontend — `RelatoriosPage` com filtro e badge dos novos status

**Files:**
- Modify: `apps/web-app/src/pages/relatorio/RelatoriosPage.tsx`

**Interfaces:**
- Consumes: `RELATORIO_STATUS_BADGE_VARIANT` (Task 8).

- [ ] **Step 1: Importar a variante de badge por status**

Trocar:

```tsx
import {
  RELATORIO_STATUS_LABELS,
  RELATORIO_TIPO_PERIODO_LABELS,
  type RelatorioStatusCodigo,
  type RelatorioTipoPeriodoCodigo,
} from '@/types/relatorio'
```

por:

```tsx
import {
  RELATORIO_STATUS_BADGE_VARIANT,
  RELATORIO_STATUS_LABELS,
  RELATORIO_TIPO_PERIODO_LABELS,
  type RelatorioStatusCodigo,
  type RelatorioTipoPeriodoCodigo,
} from '@/types/relatorio'
```

- [ ] **Step 2: Adicionar as novas opções no filtro de Status**

Trocar:

```tsx
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="0">{RELATORIO_STATUS_LABELS[0]}</SelectItem>
                  <SelectItem value="1">{RELATORIO_STATUS_LABELS[1]}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </ListFilterBar>
```

por:

```tsx
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="0">{RELATORIO_STATUS_LABELS[0]}</SelectItem>
                  <SelectItem value="1">{RELATORIO_STATUS_LABELS[1]}</SelectItem>
                  <SelectItem value="2">{RELATORIO_STATUS_LABELS[2]}</SelectItem>
                  <SelectItem value="3">{RELATORIO_STATUS_LABELS[3]}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </ListFilterBar>
```

- [ ] **Step 3: Usar a variante centralizada no badge do card**

Trocar:

```tsx
                badges={[
                  {
                    label: RELATORIO_STATUS_LABELS[r.status],
                    variant: r.status === 1 ? 'success' : 'amber',
                  },
                ]}
```

por:

```tsx
                badges={[
                  {
                    label: RELATORIO_STATUS_LABELS[r.status],
                    variant: RELATORIO_STATUS_BADGE_VARIANT[r.status],
                  },
                ]}
```

- [ ] **Step 4: Rodar os testes do arquivo (se existir) e garantir type-check**

```bash
cd apps/web-app
npx vitest run src/pages/relatorio
npx tsc --noEmit
```

Expected: PASS / sem erro de tipo.

- [ ] **Step 5: Listar arquivos alterados**

```bash
git status --short apps/web-app/src/pages/relatorio/RelatoriosPage.tsx
```

---

## Ordem de execução

Backend é sequencial por dependência de compilação: **1 → 2 → 3 → 4 → 5 → 6 → 7** (Task 4 referencia `RelatorioService.ProcessarGeracaoAsync`, que só existe de verdade na Task 6 — se rodar `dotnet build` entre as duas, o erro é esperado e some ao terminar a 6; Task 7 depende dos campos injetados na Task 6). Frontend depende do backend só por contrato de API (tipos/rotas), não por código compilado, mas segue melhor **8 → 9 → 10 → 11 → 12 → 13 → 14 → 15** pela cadeia de imports (tipos → service → hook → componente → integração na Sidebar → telas que consomem os status novos).

Depois de tudo aplicado, o teste manual fim-a-fim (comando do usuário): criar um relatório pela wizard, confirmar que a tela navega na hora pro relatório com badge "Gerando", esperar a notificação aparecer no sino (~poucos segundos, tempo real do Gemini) e conferir que o relatório carrega as seções sem precisar dar F5.
