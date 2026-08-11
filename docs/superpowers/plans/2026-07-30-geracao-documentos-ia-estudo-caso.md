# Geração de Documento via IA — Estudo de Caso Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Gerar o texto do Estudo de Caso via IA (Gemini agora, Claude depois) através de um endpoint novo, sem alterar o fluxo mecânico existente (`TextoSimulado`), com o system prompt de cada tipo de documento gerenciável pela gestora via admin.

**Architecture:** Camada `IGeradorTextoIA` trocável por provider; tabela `PromptSistemaIA` (1 linha por tipo de documento, editável via admin); endpoint novo `POST /api/EstudoDeCaso/{id}/gerar-texto-ia` que monta os dados do caso + prompt ativo e salva em coluna nova `TextoGeradoIA`, em paralelo ao `GerarTextoSimuladoAsync` existente.

**Tech Stack:** .NET (API), React + MUI (admin `apps/web`), React + Tailwind/shadcn (`apps/web-app`), Postgres via EF Core, Gemini REST API.

## Global Constraints

- Não remover, sobrescrever ou alterar comportamento de `MontarTextoSimulado` / campo `TextoSimulado` — o legado continua funcionando até validação futura (spec: seção "Fora de escopo").
- Provider de IA deve ser trocável (Gemini → Claude) sem mudar código consumidor — só a implementação de `IGeradorTextoIA` e o registro de DI.
- System prompt de cada tipo de documento vive no banco (`PromptSistemaIA`), nunca hardcoded no código de geração.
- Sem chamadas de build/migration/teste executadas automaticamente pelo implementador — toda migration/build é fornecida como comando para o usuário rodar localmente (restrição do projeto).
- Este stack (API .NET, admin `apps/web`) não tem projeto de testes automatizados hoje — os passos de verificação abaixo são manuais (build + smoke test), seguindo o padrão já estabelecido no projeto para as features anteriores (Biblioteca de Documentos). Não criar infraestrutura de teste nova sem pedido explícito do usuário (YAGNI).
- Sem commit automático — regra do usuário é decidir e executar toda operação de Git. Ao final de cada task, apenas listar os arquivos alterados.

---

### Task 1: Model `PromptSistemaIA` + coluna `TextoGeradoIA` em `EstudoDeCaso`

**Files:**
- Create: `apps/api/Models/PromptSistemaIA.cs`
- Create: `apps/api/Models/TipoDocumentoIA.cs`
- Modify: `apps/api/Models/EstudoDeCaso.cs` (adicionar propriedade `TextoGeradoIA`)
- Modify: `apps/api/Data/AppDbContext.cs:44` (adicionar `DbSet<PromptSistemaIA>` logo após `DocumentosBiblioteca`)

**Interfaces:**
- Produces: `PromptSistemaIA { Id: int, TipoDocumento: TipoDocumentoIA, Conteudo: string, CreatedAt: DateTime, UpdatedAt: DateTime }`; `TipoDocumentoIA` enum: `EstudoCaso = 0, PAEE = 1, AvaliacaoDiagnostica = 2, RelatoAtendimento = 3`; `EstudoDeCaso.TextoGeradoIA: string?`

- [ ] **Step 1: Criar o enum `TipoDocumentoIA`**

```csharp
// apps/api/Models/TipoDocumentoIA.cs
namespace api.Models
{
    public enum TipoDocumentoIA
    {
        EstudoCaso = 0,
        PAEE = 1,
        AvaliacaoDiagnostica = 2,
        RelatoAtendimento = 3,
    }
}
```

- [ ] **Step 2: Criar o model `PromptSistemaIA`**

```csharp
// apps/api/Models/PromptSistemaIA.cs
using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace api.Models
{
    [Table("prompt_sistema_ia")]
    public class PromptSistemaIA
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public TipoDocumentoIA TipoDocumento { get; set; }

        [Required]
        [Column(TypeName = "text")]
        public string Conteudo { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
```

- [ ] **Step 3: Adicionar a coluna `TextoGeradoIA` no model `EstudoDeCaso`**

Abrir `apps/api/Models/EstudoDeCaso.cs` e adicionar, logo abaixo da propriedade `TextoSimulado` existente:

```csharp
public string? TextoGeradoIA { get; set; }
```

- [ ] **Step 4: Registrar o `DbSet` no `AppDbContext`**

Em `apps/api/Data/AppDbContext.cs`, logo após a linha `public DbSet<DocumentoBiblioteca> DocumentosBiblioteca { get; set; }`:

```csharp
public DbSet<PromptSistemaIA> PromptsSistemaIA { get; set; }
```

- [ ] **Step 5: Verificação manual**

Não compilar/migrar ainda — a migration é criada na Task 2 junto com o seed. Apenas conferir visualmente que os 3 arquivos compilam sem erro de sintaxe (sem `;` faltando, namespaces corretos).

- [ ] **Step 6: Listar arquivos alterados (sem commit)**

```
apps/api/Models/TipoDocumentoIA.cs (novo)
apps/api/Models/PromptSistemaIA.cs (novo)
apps/api/Models/EstudoDeCaso.cs (modificado)
apps/api/Data/AppDbContext.cs (modificado)
```

---

### Task 2: DTOs + seed do prompt distilado de Estudo de Caso

**Files:**
- Create: `apps/api/DTOs/PromptSistemaIA/PromptSistemaIABuscarDTO.cs`
- Create: `apps/api/DTOs/PromptSistemaIA/PromptSistemaIAAtualizarDTO.cs`
- Create: migration EF (via comando `dotnet ef`, fornecido ao usuário) com `InsertData` seedando os 4 tipos

**Interfaces:**
- Consumes: `PromptSistemaIA`, `TipoDocumentoIA` (Task 1)
- Produces: `PromptSistemaIABuscarDTO { Id, TipoDocumento (string), Conteudo, UpdatedAt }`; `PromptSistemaIAAtualizarDTO { Conteudo: string }`

- [ ] **Step 1: DTO de busca**

```csharp
// apps/api/DTOs/PromptSistemaIA/PromptSistemaIABuscarDTO.cs
namespace api.DTOs.PromptSistemaIA
{
    public class PromptSistemaIABuscarDTO
    {
        public int Id { get; set; }
        public string TipoDocumento { get; set; } = string.Empty;
        public string Conteudo { get; set; } = string.Empty;
        public DateTime UpdatedAt { get; set; }
    }
}
```

- [ ] **Step 2: DTO de atualização**

```csharp
// apps/api/DTOs/PromptSistemaIA/PromptSistemaIAAtualizarDTO.cs
using System.ComponentModel.DataAnnotations;

namespace api.DTOs.PromptSistemaIA
{
    public class PromptSistemaIAAtualizarDTO
    {
        [Required]
        public string Conteudo { get; set; } = string.Empty;
    }
}
```

- [ ] **Step 3: Gerar a migration (comando pro usuário rodar)**

Depois que as Tasks 1, 3 e 4 estiverem implementadas (model, service, controller), rodar localmente:

```bash
cd apps/api
dotnet ef migrations add AddPromptSistemaIA
```

- [ ] **Step 4: Editar a migration gerada para incluir o seed**

Dentro do arquivo `Migrations/{timestamp}_AddPromptSistemaIA.cs`, no método `Up`, **depois** do bloco `migrationBuilder.CreateTable(name: "prompt_sistema_ia", ...)` já gerado automaticamente, adicionar:

```csharp
migrationBuilder.InsertData(
    table: "prompt_sistema_ia",
    columns: new[] { "TipoDocumento", "Conteudo", "CreatedAt", "UpdatedAt" },
    values: new object[,]
    {
        {
            0, // TipoDocumentoIA.EstudoCaso
            @"Você é um assistente pedagógico especializado em Atendimento Educacional Especializado (AEE), seguindo o Caderno Pedagógico ""AEE: Concepções e Metodologias"" (MEC/UFC).

REGRAS OBRIGATÓRIAS:
1. Modelo social da deficiência: nunca defina o estudante pelo diagnóstico biomédico. O foco é sempre nas barreiras que impedem participação, nunca na condição do estudante em si.
2. Use exclusivamente estas 5 categorias de barreira, sem inventar outras: comunicacional, atitudinal, física/arquitetônica, social, tecnológica.
3. Vocabulário proibido: ""reforço escolar"", ""laudo obrigatório"", ou qualquer termo capacitista que presuma incompetência do estudante.
4. Estrutura obrigatória do texto, nesta ordem: (1) Identificação inicial das demandas e barreiras; (2) Análise das barreiras e do contexto escolar; (3) Identificação das potencialidades e demandas de apoio; (4) Definição de estratégias e recursos para eliminação de barreiras.
5. Escreva citando apenas os dados fornecidos no prompt do usuário — nunca invente fatos, diagnósticos, comportamentos ou informações sobre o estudante que não estejam explicitamente informados.

ANTI-REPETIÇÃO (regra crítica): não reutilize fórmulas de conexão fixas (evite jargão de preenchimento como ""é importante ressaltar"", ""nesse sentido"", ""cabe destacar""). Cada texto deve ser redigido de forma original a partir dos dados reais daquele caso — nunca copie estrutura de frase de um caso para outro. Varie a redação a cada geração.

TOM: pedagógico, formal mas natural, redigido em português do Brasil, em texto corrido (não use bullet points na versão final). O caso ""Antônio"" do Caderno Pedagógico serve apenas como referência de tom e nível de detalhe — nunca copie frases dele literalmente.",
            DateTime.UtcNow,
            DateTime.UtcNow
        },
        {
            1, // TipoDocumentoIA.PAEE
            "Prompt ainda não definido — documento fora do escopo desta fase (ver spec de geração de documentos via IA).",
            DateTime.UtcNow,
            DateTime.UtcNow
        },
        {
            2, // TipoDocumentoIA.AvaliacaoDiagnostica
            "Prompt ainda não definido — documento fora do escopo desta fase (ver spec de geração de documentos via IA).",
            DateTime.UtcNow,
            DateTime.UtcNow
        },
        {
            3, // TipoDocumentoIA.RelatoAtendimento
            "Prompt ainda não definido — documento fora do escopo desta fase (ver spec de geração de documentos via IA).",
            DateTime.UtcNow,
            DateTime.UtcNow
        },
    });
```

No método `Down`, adicionar antes do `DropTable`:

```csharp
migrationBuilder.DeleteData(table: "prompt_sistema_ia", keyColumn: "Id", keyValues: new object[] { 1, 2, 3, 4 });
```

(ajustar os `Id` do `DeleteData` conforme os valores reais gerados pelo `InsertData` — o EF atribui `Id` sequencial a partir de 1 na ordem do array `values`).

- [ ] **Step 5: Aplicar a migration (comando pro usuário rodar)**

```bash
dotnet ef database update
```

- [ ] **Step 6: Verificação manual**

Conferir no banco (`SELECT * FROM prompt_sistema_ia;`) que existem 4 linhas, uma por `TipoDocumento` (0, 1, 2, 3), com o conteúdo do `EstudoCaso` preenchido corretamente.

- [ ] **Step 7: Listar arquivos alterados**

```
apps/api/DTOs/PromptSistemaIA/PromptSistemaIABuscarDTO.cs (novo)
apps/api/DTOs/PromptSistemaIA/PromptSistemaIAAtualizarDTO.cs (novo)
apps/api/Migrations/{timestamp}_AddPromptSistemaIA.cs (novo, gerado + editado)
```

---

### Task 3: `PromptSistemaIAService`

**Files:**
- Create: `apps/api/Services/PromptSistemaIAService.cs`

**Interfaces:**
- Consumes: `AppDbContext.PromptsSistemaIA` (Task 1), `PromptSistemaIABuscarDTO`, `PromptSistemaIAAtualizarDTO` (Task 2), `ServiceResponse<T>` (`api.Responses`, já existe no projeto)
- Produces: `PromptSistemaIAService.ListarAsync(): Task<ServiceResponse<List<PromptSistemaIABuscarDTO>>>`; `PromptSistemaIAService.AtualizarAsync(TipoDocumentoIA tipo, PromptSistemaIAAtualizarDTO dto): Task<ServiceResponse<PromptSistemaIABuscarDTO>>`; `PromptSistemaIAService.BuscarConteudoAtivoAsync(TipoDocumentoIA tipo): Task<string?>` (usado pela Task 7, sem `ServiceResponse` porque é uso interno service-to-service)

- [ ] **Step 1: Implementar o service completo**

```csharp
// apps/api/Services/PromptSistemaIAService.cs
using api.DTOs.PromptSistemaIA;
using api.Models;
using api.Responses;
using Data;
using Microsoft.EntityFrameworkCore;

namespace api.Services
{
    public class PromptSistemaIAService
    {
        private readonly AppDbContext _contexto;

        public PromptSistemaIAService(AppDbContext contexto)
        {
            _contexto = contexto;
        }

        public async Task<ServiceResponse<List<PromptSistemaIABuscarDTO>>> ListarAsync()
        {
            var resposta = new ServiceResponse<List<PromptSistemaIABuscarDTO>>();
            try
            {
                var itens = await _contexto.PromptsSistemaIA
                    .OrderBy(p => p.TipoDocumento)
                    .Select(p => new PromptSistemaIABuscarDTO
                    {
                        Id = p.Id,
                        TipoDocumento = p.TipoDocumento.ToString(),
                        Conteudo = p.Conteudo,
                        UpdatedAt = p.UpdatedAt,
                    })
                    .ToListAsync();

                resposta.AdicionaObjeto(itens);
                resposta.Sucesso = true;
                return resposta;
            }
            catch (Exception ex)
            {
                resposta.SetFalha("Erro ao listar prompts de IA: " + ex.Message);
                return resposta;
            }
        }

        public async Task<ServiceResponse<PromptSistemaIABuscarDTO>> AtualizarAsync(TipoDocumentoIA tipo, PromptSistemaIAAtualizarDTO dto)
        {
            var resposta = new ServiceResponse<PromptSistemaIABuscarDTO>();

            if (string.IsNullOrWhiteSpace(dto.Conteudo))
            {
                resposta.SetFalha("O conteúdo do prompt não pode ser vazio.");
                return resposta;
            }

            try
            {
                var entidade = await _contexto.PromptsSistemaIA.FirstOrDefaultAsync(p => p.TipoDocumento == tipo);
                if (entidade == null)
                {
                    resposta.SetFalha($"Prompt do tipo {tipo} não encontrado.");
                    return resposta;
                }

                entidade.Conteudo = dto.Conteudo.Trim();
                entidade.UpdatedAt = DateTime.UtcNow;
                await _contexto.SaveChangesAsync();

                resposta.AdicionaObjeto(new PromptSistemaIABuscarDTO
                {
                    Id = entidade.Id,
                    TipoDocumento = entidade.TipoDocumento.ToString(),
                    Conteudo = entidade.Conteudo,
                    UpdatedAt = entidade.UpdatedAt,
                });
                resposta.Sucesso = true;
                resposta.AdicionaMensagem("Prompt atualizado com sucesso.");
                return resposta;
            }
            catch (Exception ex)
            {
                resposta.SetFalha("Erro ao atualizar prompt de IA: " + ex.Message);
                return resposta;
            }
        }

        // Uso interno por outros services (ex.: EstudoDeCasoService) — sem envelope ServiceResponse.
        public async Task<string?> BuscarConteudoAtivoAsync(TipoDocumentoIA tipo)
        {
            var entidade = await _contexto.PromptsSistemaIA
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.TipoDocumento == tipo);
            return entidade?.Conteudo;
        }
    }
}
```

- [ ] **Step 2: Verificação manual**

Revisar o arquivo: confirmar que os três métodos usam `ServiceResponse<T>` do mesmo jeito que `DocumentoBibliotecaService` (padrão já usado no projeto), e que `BuscarConteudoAtivoAsync` não lança exceção quando não encontra (retorna `null`, tratado pelo consumidor na Task 7).

- [ ] **Step 3: Listar arquivos alterados**

```
apps/api/Services/PromptSistemaIAService.cs (novo)
```

---

### Task 4: `PromptSistemaIAController` + registrar DI

**Files:**
- Create: `apps/api/Controllers/PromptSistemaIAController.cs`
- Modify: `apps/api/Program.cs` (registrar `PromptSistemaIAService` no DI, ao lado dos demais `AddScoped`)

**Interfaces:**
- Consumes: `PromptSistemaIAService` (Task 3), `TipoDocumentoIA` (Task 1)
- Produces: `GET /api/prompt-sistema-ia` (lista os 4 tipos), `PUT /api/prompt-sistema-ia/{tipo}` (atualiza conteúdo de um tipo) — ambos `[Authorize(Roles = "Admin")]`

- [ ] **Step 1: Implementar o controller**

```csharp
// apps/api/Controllers/PromptSistemaIAController.cs
using api.DTOs.PromptSistemaIA;
using api.Models;
using api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace api.Controllers
{
    [Authorize(Roles = "Admin")]
    [ApiController]
    [Route("api/prompt-sistema-ia")]
    public class PromptSistemaIAController : ControllerBase
    {
        private readonly PromptSistemaIAService _service;

        public PromptSistemaIAController(PromptSistemaIAService service)
        {
            _service = service;
        }

        [HttpGet]
        public async Task<IActionResult> Listar()
        {
            var response = await _service.ListarAsync();
            return response.Sucesso ? Ok(response) : BadRequest(response);
        }

        [HttpPut("{tipo}")]
        public async Task<IActionResult> Atualizar(string tipo, [FromBody] PromptSistemaIAAtualizarDTO dto)
        {
            if (!Enum.TryParse<TipoDocumentoIA>(tipo, true, out var tipoDocumento))
                return BadRequest(new { mensagem = $"Tipo de documento inválido: {tipo}" });

            var response = await _service.AtualizarAsync(tipoDocumento, dto);
            return response.Sucesso ? Ok(response) : BadRequest(response);
        }
    }
}
```

- [ ] **Step 2: Registrar o service no `Program.cs`**

Em `apps/api/Program.cs`, logo após a linha `builder.Services.AddScoped<DocumentoBibliotecaService>();`:

```csharp
builder.Services.AddScoped<PromptSistemaIAService>();
```

- [ ] **Step 3: Verificação manual (comando pro usuário rodar)**

```bash
cd apps/api
dotnet build
```

Esperado: build sem erros. Depois, com a API rodando localmente e um token de Admin válido:

```bash
curl -H "Authorization: Bearer $TOKEN" http://localhost:5000/api/prompt-sistema-ia
```

Esperado: JSON com 4 itens (`EstudoCaso`, `PAEE`, `AvaliacaoDiagnostica`, `RelatoAtendimento`).

- [ ] **Step 4: Listar arquivos alterados**

```
apps/api/Controllers/PromptSistemaIAController.cs (novo)
apps/api/Program.cs (modificado)
```

---

### Task 5: Abstração de provider de IA (`IGeradorTextoIA` + `GeminiGeradorTextoIA`)

**Files:**
- Create: `apps/api/Services/IA/IGeradorTextoIA.cs`
- Create: `apps/api/Services/IA/GeminiGeradorTextoIA.cs`
- Modify: `apps/api/Program.cs` (registrar `IGeradorTextoIA` → `GeminiGeradorTextoIA` via DI + `HttpClient` nomeado)
- Modify: `apps/api/appsettings.json` (adicionar seção `Gemini`)

**Interfaces:**
- Produces: `IGeradorTextoIA.GerarTextoAsync(string systemPrompt, string prompt): Task<string>` — lança `InvalidOperationException` com mensagem amigável se a chamada falhar (tratado pelo consumidor na Task 7)

- [ ] **Step 1: Criar a interface**

```csharp
// apps/api/Services/IA/IGeradorTextoIA.cs
namespace api.Services.IA
{
    public interface IGeradorTextoIA
    {
        Task<string> GerarTextoAsync(string systemPrompt, string prompt);
    }
}
```

- [ ] **Step 2: Implementar `GeminiGeradorTextoIA`**

```csharp
// apps/api/Services/IA/GeminiGeradorTextoIA.cs
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Configuration;

namespace api.Services.IA
{
    public class GeminiGeradorTextoIA : IGeradorTextoIA
    {
        private readonly HttpClient _httpClient;
        private readonly string _apiKey;
        private readonly string _model;

        public GeminiGeradorTextoIA(HttpClient httpClient, IConfiguration configuration)
        {
            _httpClient = httpClient;
            _apiKey = configuration["Gemini:ApiKey"]
                ?? throw new InvalidOperationException("Gemini:ApiKey não configurada em appsettings.");
            _model = configuration["Gemini:Model"] ?? "gemini-2.0-flash";
        }

        public async Task<string> GerarTextoAsync(string systemPrompt, string prompt)
        {
            var url = $"https://generativelanguage.googleapis.com/v1beta/models/{_model}:generateContent?key={_apiKey}";

            var corpo = new
            {
                system_instruction = new
                {
                    parts = new[] { new { text = systemPrompt } }
                },
                contents = new[]
                {
                    new { parts = new[] { new { text = prompt } } }
                }
            };

            var json = JsonSerializer.Serialize(corpo);
            using var conteudo = new StringContent(json, Encoding.UTF8, "application/json");

            HttpResponseMessage resposta;
            try
            {
                resposta = await _httpClient.PostAsync(url, conteudo);
            }
            catch (HttpRequestException ex)
            {
                throw new InvalidOperationException("Não foi possível conectar ao serviço de IA (Gemini). Tente novamente em instantes.", ex);
            }

            var corpoResposta = await resposta.Content.ReadAsStringAsync();

            if (!resposta.IsSuccessStatusCode)
            {
                throw new InvalidOperationException($"Erro ao gerar texto via IA (Gemini, status {(int)resposta.StatusCode}): {corpoResposta}");
            }

            using var documento = JsonDocument.Parse(corpoResposta);
            var texto = documento.RootElement
                .GetProperty("candidates")[0]
                .GetProperty("content")
                .GetProperty("parts")[0]
                .GetProperty("text")
                .GetString();

            if (string.IsNullOrWhiteSpace(texto))
                throw new InvalidOperationException("O serviço de IA retornou uma resposta vazia.");

            return texto.Trim();
        }
    }
}
```

- [ ] **Step 3: Registrar `HttpClient` nomeado + DI no `Program.cs`**

Logo após a linha `builder.Services.AddScoped<PromptSistemaIAService>();`:

```csharp
builder.Services.AddHttpClient<api.Services.IA.IGeradorTextoIA, api.Services.IA.GeminiGeradorTextoIA>();
```

(`AddHttpClient<TInterface, TImplementation>` já registra tanto o `HttpClient` tipado quanto o binding de DI — não precisa de mais nada. Quando o `ClaudeGeradorTextoIA` existir, a troca de provider é: mudar essa linha para `AddHttpClient<IGeradorTextoIA, ClaudeGeradorTextoIA>()`.)

- [ ] **Step 4: Adicionar configuração no `appsettings.json`**

Em `apps/api/appsettings.json`, adicionar a seção (o valor real da chave é preenchido pelo usuário, nunca commitado em texto puro em produção — usar variável de ambiente ou secret manager no deploy):

```json
"Gemini": {
  "ApiKey": "{GEMINI_API_KEY}",
  "Model": "gemini-2.0-flash"
}
```

- [ ] **Step 5: Verificação manual**

Confirmar que `dotnet build` (rodado pelo usuário) não acusa erro de tipo — `IGeradorTextoIA` e `GeminiGeradorTextoIA` estão no namespace `api.Services.IA`, então qualquer arquivo consumidor (Task 7) precisa do `using api.Services.IA;`.

- [ ] **Step 6: Listar arquivos alterados**

```
apps/api/Services/IA/IGeradorTextoIA.cs (novo)
apps/api/Services/IA/GeminiGeradorTextoIA.cs (novo)
apps/api/Program.cs (modificado)
apps/api/appsettings.json (modificado)
```

---

### Task 6: `EstudoDeCasoService.GerarTextoIAAsync` + montagem do prompt

**Files:**
- Modify: `apps/api/Services/EstudoDeCasoService.cs` (novo método + using novo)
- Modify: `apps/api/DTOs/EstudoDeCaso/EstudoDeCasoDTO.cs` (adicionar `TextoGeradoIA` em `EstudoDeCasoDetalheDTO`)

**Interfaces:**
- Consumes: `IGeradorTextoIA` (Task 5), `PromptSistemaIAService.BuscarConteudoAtivoAsync` (Task 3), `TipoDocumentoIA.EstudoCaso` (Task 1), `MontarTextoSimulado` existente (reaproveita mesma coleta de dados)
- Produces: `EstudoDeCasoService.GerarTextoIAAsync(int id, Usuario usuario): Task<ServiceResponse<EstudoDeCasoDetalheDTO>>`; `EstudoDeCasoDetalheDTO.TextoGeradoIA: string?`

- [ ] **Step 1: Adicionar `TextoGeradoIA` ao DTO de detalhe**

Em `apps/api/DTOs/EstudoDeCaso/EstudoDeCasoDTO.cs`, na classe `EstudoDeCasoDetalheDTO`, logo abaixo de `public string? TextoSimulado { get; set; }`:

```csharp
public string? TextoGeradoIA { get; set; }
```

- [ ] **Step 2: Atualizar `MapearDetalhe` para incluir o novo campo**

Em `apps/api/Services/EstudoDeCasoService.cs`, dentro do método `MapearDetalhe` (já existente), logo após a linha `TextoSimulado = entity.TextoSimulado,`:

```csharp
TextoGeradoIA = entity.TextoGeradoIA,
```

- [ ] **Step 3: Adicionar o construtor com `PromptSistemaIAService` e `IGeradorTextoIA`**

No topo da classe `EstudoDeCasoService`, adicionar os dois `using` novos:

```csharp
using api.Services.IA;
```

Trocar o construtor existente (que hoje só recebe `AppDbContext db`) para também receber os dois novos serviços, mantendo o campo `_db` como está:

```csharp
private readonly AppDbContext _db;
private readonly PromptSistemaIAService _promptService;
private readonly IGeradorTextoIA _geradorTextoIA;

public EstudoDeCasoService(AppDbContext db, PromptSistemaIAService promptService, IGeradorTextoIA geradorTextoIA)
{
    _db = db;
    _promptService = promptService;
    _geradorTextoIA = geradorTextoIA;
}
```

- [ ] **Step 4: Implementar `GerarTextoIAAsync`**

Adicionar este método logo após `GerarTextoSimuladoAsync` (que já existe no arquivo) — reaproveita a mesma consulta de dados e o mesmo helper `MontarTextoSimulado` já usado para montar as informações estruturadas do caso, mas em vez de aplicar o texto direto, usa esses dados para montar o prompt do usuário e chama a IA:

```csharp
public async Task<ServiceResponse<EstudoDeCasoDetalheDTO>> GerarTextoIAAsync(int id, Usuario usuario)
{
    var r = new ServiceResponse<EstudoDeCasoDetalheDTO>();
    var pid = usuario.ProfessorId ?? 0;
    if (pid == 0)
    {
        r.SetFalha("Professor não vinculado ao usuário.");
        return r;
    }

    try
    {
        var entity = await _db.EstudosCaso
            .Include(c => c.Professor)
            .Include(c => c.Aluno)
            .ThenInclude(a => a.Escola)
            .Include(c => c.ItensEixo)
            .ThenInclude(i => i.CatalogoEixo)
            .FirstOrDefaultAsync(c => c.Id == id && c.ProfessorId == pid);

        if (entity == null)
        {
            r.SetFalha("Estudo de caso não encontrado.");
            return r;
        }

        var diagnosticoRecente = await _db.DiagnosticosFinais
            .AsNoTracking()
            .Include(d => d.AvaliacaoDiagnostica)
            .Where(d => d.AlunoId == entity.AlunoId)
            .OrderByDescending(d => d.GeradoEm)
            .FirstOrDefaultAsync();

        var systemPrompt = await _promptService.BuscarConteudoAtivoAsync(TipoDocumentoIA.EstudoCaso);
        if (string.IsNullOrWhiteSpace(systemPrompt))
        {
            r.SetFalha("Nenhum prompt de sistema cadastrado para Estudo de Caso. Peça à gestora para configurar em Prompts de IA.");
            return r;
        }

        var promptUsuario = MontarPromptEstudoCaso(entity, diagnosticoRecente);

        string textoGerado;
        try
        {
            textoGerado = await _geradorTextoIA.GerarTextoAsync(systemPrompt, promptUsuario);
        }
        catch (InvalidOperationException ex)
        {
            r.SetFalha(ex.Message);
            return r;
        }

        entity.TextoGeradoIA = textoGerado;
        entity.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        var dto = MapearDetalhe(entity);
        r.AdicionaObjeto(dto);
        r.AdicionaMensagem("Texto gerado por IA. Revise antes de usar em documentos oficiais.");
        r.Sucesso = true;
        return r;
    }
    catch (Exception ex)
    {
        r.SetFalha($"Erro ao gerar texto via IA: {ex.Message}");
        return r;
    }
}
```

- [ ] **Step 5: Implementar `MontarPromptEstudoCaso` (dados estruturados, não texto narrativo)**

Adicionar este método privado logo após `MontarTextoSimulado` (existente) — ao contrário dele, este não escreve prosa, apenas organiza os dados brutos para a IA redigir:

```csharp
private static string MontarPromptEstudoCaso(EstudoDeCaso entity, DiagnosticoFinal? diagnosticoRecente)
{
    var nome = entity.Aluno?.NomeCompleto?.Trim() ?? "Aluno(a)";
    var escola = entity.Aluno?.Escola?.NomeInstituicao?.Trim() ?? "não informado";
    var professor = entity.Professor?.NomeCompleto?.Trim() ?? "não informado";
    var anoSerie = entity.Aluno?.Ano?.Trim() ?? "não informado";

    var sb = new System.Text.StringBuilder();
    sb.AppendLine("Redija o texto do Estudo de Caso a partir destes dados (siga a estrutura de 4 etapas definida no system prompt):");
    sb.AppendLine();
    sb.AppendLine($"Estudante: {nome}");
    sb.AppendLine($"Ano/Série: {anoSerie}");
    sb.AppendLine($"Escola: {escola}");
    sb.AppendLine($"Professor(a) do AEE: {professor}");
    sb.AppendLine();
    sb.AppendLine($"Título do estudo: {entity.Titulo.Trim()}");
    sb.AppendLine($"Contexto/situação relatada: {entity.ContextoSituacao.Trim()}");

    if (!string.IsNullOrWhiteSpace(entity.Potencialidades))
        sb.AppendLine($"Potencialidades observadas: {entity.Potencialidades.Trim()}");

    if (diagnosticoRecente != null)
    {
        sb.AppendLine();
        sb.AppendLine($"Diagnóstico pedagógico mais recente (avaliação diagnóstica): perfil de autonomia = {diagnosticoRecente.NivelPerfilAutonomia}");
        if (!string.IsNullOrWhiteSpace(diagnosticoRecente.Resumo))
            sb.AppendLine($"Resumo do diagnóstico: {diagnosticoRecente.Resumo.Trim()}");
    }
    else
    {
        sb.AppendLine();
        sb.AppendLine("Não há diagnóstico pedagógico registrado na plataforma até o momento.");
    }

    sb.AppendLine();
    sb.AppendLine("Barreiras e anotações por eixo (use estas informações reais, não invente novas):");
    var eixosOrdenados = entity.ItensEixo.OrderBy(i => i.CatalogoEixo?.OrdemExibicao ?? 0).ToList();
    foreach (var item in eixosOrdenados)
    {
        var rotulo = item.CatalogoEixo?.Rotulo ?? $"Eixo #{item.EixoCatalogoId}";
        var anotacao = string.IsNullOrWhiteSpace(item.Anotacao) ? "(sem anotação registrada)" : item.Anotacao.Trim();
        sb.AppendLine($"- {rotulo}: {anotacao}");
    }

    return sb.ToString();
}
```

- [ ] **Step 6: Verificação manual (comando pro usuário rodar)**

```bash
cd apps/api
dotnet build
```

Esperado: build sem erros — checar especialmente que os tipos `DiagnosticoFinal.NivelPerfilAutonomia` e `.Resumo` batem com os já usados em `MontarTextoSimulado` (mesmo model, mesmos nomes de propriedade).

- [ ] **Step 7: Listar arquivos alterados**

```
apps/api/DTOs/EstudoDeCaso/EstudoDeCasoDTO.cs (modificado)
apps/api/Services/EstudoDeCasoService.cs (modificado)
```

---

### Task 7: Endpoint `POST /api/EstudoDeCaso/{id}/gerar-texto-ia`

**Files:**
- Modify: `apps/api/Controllers/EstudoDeCasoController.cs`

**Interfaces:**
- Consumes: `EstudoDeCasoService.GerarTextoIAAsync` (Task 6)
- Produces: `POST /api/EstudoDeCaso/{id}/gerar-texto-ia` — mesmo contrato de resposta do `gerar-texto-simulado` existente (`ServiceResponse<EstudoDeCasoDetalheDTO>`)

- [ ] **Step 1: Adicionar o endpoint**

Em `apps/api/Controllers/EstudoDeCasoController.cs`, logo após o método `GerarTextoSimulado` existente (antes do fechamento da classe):

```csharp
[HttpPost("{id:int}/gerar-texto-ia")]
public async Task<IActionResult> GerarTextoIA(int id)
{
    var usuario = await _userManager.GetUserAsync(User);
    if (usuario == null)
        return Unauthorized();

    var resposta = await _service.GerarTextoIAAsync(id, usuario);
    if (!resposta.Sucesso)
    {
        return resposta.Mensagens.Any(m => m.Contains("não encontrado", StringComparison.OrdinalIgnoreCase))
            ? NotFound(resposta)
            : BadRequest(resposta);
    }

    return Ok(resposta);
}
```

- [ ] **Step 2: Verificação manual (comando pro usuário rodar)**

```bash
cd apps/api
dotnet build
```

Com a API rodando e um Estudo de Caso existente (`id` válido), testar:

```bash
curl -X POST -H "Authorization: Bearer $TOKEN" http://localhost:5000/api/EstudoDeCaso/1/gerar-texto-ia
```

Esperado: `200 OK` com `objeto.textoGeradoIA` preenchido, sem alterar `textoSimulado`.

- [ ] **Step 3: Listar arquivos alterados**

```
apps/api/Controllers/EstudoDeCasoController.cs (modificado)
```

---

### Task 8: Admin (`apps/web`) — aba "Prompts de IA"

**Files:**
- Create: `apps/web/src/services/promptsIAService.ts`
- Create: `apps/web/src/pages/Documentos/PromptsIA.tsx`
- Modify: `apps/web/src/components/Sidebar.tsx` (adicionar item no grupo `documentosGroup` já existente)
- Modify: `apps/web/src/App.tsx` (adicionar rota `/prompts-ia`)

**Interfaces:**
- Consumes: `GET /api/prompt-sistema-ia`, `PUT /api/prompt-sistema-ia/{tipo}` (Task 4)
- Produces: página funcional em `/prompts-ia`, acessível pelo grupo "Documentos" no menu admin

- [ ] **Step 1: Criar o service**

```typescript
// apps/web/src/services/promptsIAService.ts
import { api } from '../api/http'

export interface PromptSistemaIA {
  id: number
  tipoDocumento: string
  conteudo: string
  updatedAt: string
}

interface ServiceResponse<T> {
  sucesso: boolean
  mensagens: string[]
  objeto?: T
}

function extractErrorMessage(error: unknown, fallback: string): string {
  const data = (error as { response?: { data?: { mensagens?: string[] } } })?.response?.data
  if (data?.mensagens?.length) return data.mensagens.join(', ')
  return fallback
}

export const promptsIAService = {
  listar: async (): Promise<PromptSistemaIA[]> => {
    try {
      const response = await api.get<ServiceResponse<PromptSistemaIA[]>>('/prompt-sistema-ia')
      return response.data.objeto ?? []
    } catch (error: unknown) {
      throw new Error(extractErrorMessage(error, 'Não foi possível carregar os prompts de IA.'))
    }
  },

  atualizar: async (tipoDocumento: string, conteudo: string): Promise<PromptSistemaIA> => {
    try {
      const response = await api.put<ServiceResponse<PromptSistemaIA>>(
        `/prompt-sistema-ia/${tipoDocumento}`,
        { conteudo },
      )
      return response.data.objeto as PromptSistemaIA
    } catch (error: unknown) {
      throw new Error(extractErrorMessage(error, 'Erro ao salvar o prompt.'))
    }
  },
}

export default promptsIAService
```

- [ ] **Step 2: Criar a página**

```tsx
// apps/web/src/pages/Documentos/PromptsIA.tsx
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Alert, Box, Button, Paper, Stack, Typography } from '@mui/material'
import promptsIAService, { type PromptSistemaIA } from '../../services/promptsIAService'
import LoadingState from '../../components/common/LoadingState'
import ErrorState from '../../components/common/ErrorState'

const ROTULOS: Record<string, string> = {
  EstudoCaso: 'Estudo de Caso',
  PAEE: 'Plano de AEE (PAEE)',
  AvaliacaoDiagnostica: 'Avaliação Diagnóstica',
  RelatoAtendimento: 'Relato de Atendimento',
}

function PromptCard({ prompt }: { prompt: PromptSistemaIA }) {
  const queryClient = useQueryClient()
  const [conteudo, setConteudo] = useState(prompt.conteudo)
  const [showSuccess, setShowSuccess] = useState(false)

  const salvarMutation = useMutation({
    mutationFn: () => promptsIAService.atualizar(prompt.tipoDocumento, conteudo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prompts-ia'] })
      setShowSuccess(true)
      window.setTimeout(() => setShowSuccess(false), 3000)
    },
  })

  const alterado = conteudo !== prompt.conteudo

  return (
    <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: '12px' }}>
      <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
        {ROTULOS[prompt.tipoDocumento] ?? prompt.tipoDocumento}
      </Typography>

      {showSuccess && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Prompt salvo com sucesso.
        </Alert>
      )}

      {salvarMutation.isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {(salvarMutation.error as Error).message}
        </Alert>
      )}

      <textarea
        value={conteudo}
        onChange={(e) => setConteudo(e.target.value)}
        rows={10}
        style={{
          width: '100%',
          fontFamily: 'monospace',
          fontSize: '0.85rem',
          padding: '12px',
          borderRadius: '8px',
          border: '1px solid #d1d5db',
          resize: 'vertical',
        }}
      />

      <Stack direction="row" justifyContent="flex-end" sx={{ mt: 2 }}>
        <Button
          variant="contained"
          disabled={!alterado || salvarMutation.isPending}
          onClick={() => salvarMutation.mutate()}
        >
          {salvarMutation.isPending ? 'Salvando...' : 'Salvar alterações'}
        </Button>
      </Stack>
    </Paper>
  )
}

export default function PromptsIA() {
  const { data: prompts = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: ['prompts-ia'],
    queryFn: () => promptsIAService.listar(),
  })

  const errorMessage = error instanceof Error ? error.message : 'Erro ao carregar os prompts de IA.'

  return (
    <Box>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 720 }}>
        Regras que a IA segue ao gerar cada tipo de documento. Alterações aqui valem imediatamente,
        sem precisar de deploy.
      </Typography>

      {isLoading && <LoadingState variant="cards" />}
      {isError && <ErrorState message={errorMessage} onRetry={() => refetch()} />}

      {!isLoading && !isError && (
        <Stack spacing={3}>
          {prompts.map((prompt) => (
            <PromptCard key={prompt.id} prompt={prompt} />
          ))}
        </Stack>
      )}
    </Box>
  )
}
```

- [ ] **Step 3: Adicionar item no `documentosGroup` do `Sidebar.tsx`**

Em `apps/web/src/components/Sidebar.tsx`, dentro do array `documentosGroup` (já existe, criado na feature de Biblioteca de Modelos), adicionar mais um item:

```typescript
const documentosGroup = [
  { text: 'Biblioteca de Modelos', icon: <Files size={20} weight="fill" />, path: '/biblioteca-modelos' },
  { text: 'Prompts de IA', icon: <SettingsIcon />, path: '/prompts-ia' },
]
```

(`SettingsIcon` já está importado no topo do arquivo — reaproveita o ícone existente de `@mui/icons-material`, sem import novo.)

- [ ] **Step 4: Adicionar a rota no `App.tsx`**

Em `apps/web/src/App.tsx`, logo após `const BibliotecaModelos = lazy(() => import('./pages/Documentos/BibliotecaModelos'))`:

```typescript
const PromptsIA = lazy(() => import('./pages/Documentos/PromptsIA'))
```

E na lista de rotas protegidas, logo após `<Route path="/biblioteca-modelos" element={<BibliotecaModelos />} />`:

```tsx
<Route path="/prompts-ia" element={<PromptsIA />} />
```

- [ ] **Step 5: Verificação manual**

Rodar o admin localmente (comando pro usuário), navegar até "Documentos" → "Prompts de IA", confirmar que os 4 cards aparecem, editar o texto de um deles, salvar, recarregar a página e confirmar que a mudança persistiu.

- [ ] **Step 6: Listar arquivos alterados**

```
apps/web/src/services/promptsIAService.ts (novo)
apps/web/src/pages/Documentos/PromptsIA.tsx (novo)
apps/web/src/components/Sidebar.tsx (modificado)
apps/web/src/App.tsx (modificado)
```

---

### Task 9: web-app (professora) — botão "Gerar com IA (beta)" no Estudo de Caso

**Files:**
- Modify: `apps/web-app/src/types/estudoCaso.ts` (adicionar `textoGeradoIA`)
- Modify: `apps/web-app/src/services/estudoCasoService.ts` (nova função)
- Modify: `apps/web-app/src/pages/estudo-caso/EstudoCasoDetalheDialog.tsx` (novo botão + exibição)

**Interfaces:**
- Consumes: `POST /api/EstudoDeCaso/{id}/gerar-texto-ia` (Task 7)
- Produces: `gerarTextoIAEstudoCaso(id: number): Promise<EstudoCasoDetalhe>`; `EstudoCasoDetalhe.textoGeradoIA?: string | null`

- [ ] **Step 1: Adicionar o campo no type**

Em `apps/web-app/src/types/estudoCaso.ts`, na interface `EstudoCasoDetalhe`, logo após `textoSimulado?: string | null`:

```typescript
textoGeradoIA?: string | null
```

- [ ] **Step 2: Adicionar a função no service**

Em `apps/web-app/src/services/estudoCasoService.ts`, logo após `gerarTextoSimuladoEstudoCaso` (já existe no arquivo):

```typescript
export const gerarTextoIAEstudoCaso = async (id: number): Promise<EstudoCasoDetalhe> => {
  const { data } = await api.post<ServiceResponse<EstudoCasoDetalhe>>(
    `/EstudoDeCaso/${id}/gerar-texto-ia`,
    {}
  )
  return unwrapObjeto(data)
}
```

- [ ] **Step 3: Adicionar o import no componente**

Em `apps/web-app/src/pages/estudo-caso/EstudoCasoDetalheDialog.tsx`, na linha do import de `estudoCasoService` (já existe), adicionar `gerarTextoIAEstudoCaso` à lista:

```typescript
import {
  atualizarEstudoCaso,
  buscarEixosEstudoCasoCatalogo,
  buscarEstudoCasoPorId,
  excluirEstudoCaso,
  gerarTextoIAEstudoCaso,
  gerarTextoSimuladoEstudoCaso,
} from '@/services/estudoCasoService'
```

Também adicionar o ícone `Sparkle` ao import existente de `@phosphor-icons/react`:

```typescript
import { Copy, DownloadSimple, FilePdf, Lightning, PencilSimple, Sparkle, Trash } from '@phosphor-icons/react'
```

- [ ] **Step 4: Adicionar a mutation, logo após `gerarMutation` (já existe)**

```typescript
const gerarIAMutation = useMutation({
  mutationFn: () => gerarTextoIAEstudoCaso(estudoId!),
  onSuccess: (d) => {
    qc.setQueryData(['estudo-caso', estudoId], d)
    qc.invalidateQueries({ queryKey: ['estudos-caso-aluno', d.alunoId] })
    qc.invalidateQueries({ queryKey: ['estudos-caso-lista'] })
    success('Documento gerado por IA', 'Revise o texto antes de usar em documentos oficiais.')
  },
  onError: (err: unknown) => {
    const fb = getApiErrorFeedback(err)
    showError(fb.title, formatFriendlyErrorBody(fb))
  },
})
```

- [ ] **Step 5: Adicionar o botão ao lado do "Gerar documento" existente**

No bloco JSX que já tem o botão `gerarMutation` (procurar `onClick={() => gerarMutation.mutate()}` dentro do `div` de ações do "Documento"), adicionar logo antes desse botão:

```tsx
<Button
  type="button"
  size="sm"
  variant="secondary"
  loading={gerarIAMutation.isPending}
  onClick={() => gerarIAMutation.mutate()}
>
  <Sparkle size={14} />
  Gerar com IA (beta)
</Button>
```

- [ ] **Step 6: Exibir o texto gerado por IA, abaixo do bloco existente do texto simulado**

Logo após o bloco `<DocGeracaoAnimation isGenerating={gerarMutation.isPending} ...>` (já existente, que mostra `detalhe.textoSimulado`), adicionar:

```tsx
{detalhe.textoGeradoIA?.trim() && (
  <div className="mt-4 pt-4 border-t border-border">
    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
      Versão gerada por IA (beta) — revise antes de usar
    </p>
    <EstudoCasoDocumentoViewer
      texto={detalhe.textoGeradoIA}
      scrollClassName="max-h-[min(52vh,520px)]"
    />
  </div>
)}
```

- [ ] **Step 7: Verificação manual**

Rodar o web-app localmente (comando pro usuário), abrir um Estudo de Caso já existente, clicar em "Gerar com IA (beta)", confirmar que aparece o bloco novo abaixo do texto mecânico existente (sem substituí-lo), com o texto redigido pela IA.

- [ ] **Step 8: Listar arquivos alterados**

```
apps/web-app/src/types/estudoCaso.ts (modificado)
apps/web-app/src/services/estudoCasoService.ts (modificado)
apps/web-app/src/pages/estudo-caso/EstudoCasoDetalheDialog.tsx (modificado)
```

---

## Ordem de execução recomendada

Tasks 1 → 2 → 3 → 4 (backend: model, DTOs+seed, service, controller) → 5 (provider de IA) → 6 → 7 (geração real no Estudo de Caso) → 8 (admin) → 9 (web-app). A Task 2 depende da Task 3 e 4 já existirem no código (o `dotnet ef migrations add` só funciona com o `DbContext` e os services registrados), então a ordem real de *implementação* de código é 1 → 3 → 4 → 2 (rodar a migration) → 5 → 6 → 7 → 8 → 9. Segui a numeração acima pela lógica de leitura (model → dados → service → controller), mas ao executar, gerar a migration só depois que Tasks 1, 3 e 4 estiverem com o código escrito.
