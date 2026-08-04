# Geração de Documentos via IA — Estudo de Caso (sub-projeto 1)

## Contexto

Hoje o sistema gera 4 documentos de forma mecânica (concatenação de dados de formulário em template fixo), sem nenhuma IA envolvida:

- **Estudo de Caso** — texto simulado (`EstudoDeCasoService.MontarTextoSimulado`, StringBuilder)
- **PAEE / Planejamento** — docx gerado client-side (`docx.js`)
- **Avaliação Diagnóstica** — PDF via QuestPDF (mais tabular que narrativo)
- **Relato de Atendimento** — relatório consolidado mensal + sugestões

A cliente quer que todos passem a ser gerados por IA. Dado o escopo (4 subsistemas independentes), o trabalho foi dividido em sub-projetos — este documento cobre apenas o **primeiro: Estudo de Caso**. Os demais repetem o mesmo padrão de arquitetura em specs futuras.

Requisito explícito: criar **estrutura nova, em paralelo ao que já existe**, sem mexer no fluxo legado. O legado (`MontarTextoSimulado` / campo `TextoSimulado`) só será removido depois que os geradores de IA estiverem validados em produção para os 4 documentos.

## Referência normativa

A geração deve seguir o Caderno Pedagógico **"Atendimento Educacional Especializado (AEE): Concepções e Metodologias"** (MEC/UFC, 2026), especialmente as seções 6.1–6.5:

- Modelo social da deficiência — nunca definir o estudante por diagnóstico biomédico
- 5 categorias fixas de barreira: comunicacional, atitudinal, física/arquitetônica, social, tecnológica
- Vocabulário proibido: "reforço escolar", "laudo obrigatório", termos capacitistas
- Estrutura das 4 etapas do Estudo de Caso (identificação inicial → análise de barreiras → potencialidades/apoio → estratégias/recursos)

Essas regras já mapeiam 1:1 com os campos existentes (`EstudoDeCasoEixoCatalogo`, `DiagnosticoFinal`, barreiras já categorizadas) — a IA não precisa inventar estrutura nova, só redigir melhor em cima do que já é coletado.

## Decisões

| Decisão | Escolha | Por quê |
|---|---|---|
| Provider de IA | Google Gemini (free tier) agora; Anthropic Claude depois | Fase de teste sem custo; troca planejada desde já |
| Arquitetura de provider | Interface `IGeradorTextoIA`, implementação trocável via config | Trocar provider = 1 classe nova + 1 linha de DI, zero mudança no resto |
| Regras/vocabulário da IA | Destilado do Caderno Pedagógico em texto curto, não o PDF inteiro | PDF completo tem ~27k tokens (custo alto, muita base legal irrelevante pra geração); só as seções operacionais (6.1–6.5) importam |
| Onde vive o system prompt | Tabela nova no banco (`PromptSistemaIA`), editável via admin | Regras mudam com legislação (ex.: Decreto 12.686/2025 citado no próprio caderno); gestora edita sem deploy |
| Convivência com legado | Endpoint novo + campo novo na tabela existente | Não filtra nem substitui `TextoSimulado`; front pode exibir os dois até a cliente validar qualidade |

## Arquitetura

```
Admin (apps/web)                    API (.NET)                         web-app / professora
┌─────────────────────┐   CRUD    ┌─────────────────────────┐
│ Aba "Prompts de IA"  │──────────▶│ PromptSistemaIA (tabela) │
│ (grupo Documentos)   │           │ TipoDocumento, Conteudo  │
└─────────────────────┘           └───────────┬─────────────┘
                                               │ busca prompt ativo
                                               ▼
                                   ┌─────────────────────────┐
                        (existe)   │ IGeradorTextoIA          │
                        endpoint   │  └─ GeminiGeradorTextoIA │ (Gemini agora)
                    ┌──────────────┤  └─ ClaudeGeradorTextoIA │ (Claude depois,
                    │              └─────────────────────────┘  troca via config)
                    ▼
        POST /api/estudo-caso/{id}/gerar-texto-ia   (NOVO, paralelo ao
                    │                                 GerarTextoSimuladoAsync existente)
                    ▼
        EstudoDeCaso.TextoGeradoIA (NOVA coluna — não sobrescreve TextoSimulado)
```

## Componentes

### 1. Tabela `PromptSistemaIA` (nova)

```
Id                int
TipoDocumento     enum (EstudoCaso, PAEE, AvaliacaoDiagnostica, RelatoAtendimento)
Conteudo          text — o system prompt em si
Ativo             bool
CreatedAt / UpdatedAt
```

Só um registro `Ativo = true` por `TipoDocumento` (o service garante isso ao ativar um novo). Seed inicial do tipo `EstudoCaso` = destilado das seções 6.1–6.5 do Caderno Pedagógico.

### 2. Abstração de provider (`apps/api/Services/IA/`)

```csharp
public interface IGeradorTextoIA
{
    Task<string> GerarTextoAsync(string systemPrompt, string prompt);
}
```

- `GeminiGeradorTextoIA` — HttpClient contra a API REST do Gemini (free tier, chave em `appsettings: Gemini:ApiKey`)
- Registro em DI seleciona a implementação por `appsettings: IA:Provider` (`"Gemini"` | `"Claude"`) — trocar de provider não muda nenhum outro arquivo
- `ClaudeGeradorTextoIA` fica como stub/próxima implementação (fora do escopo deste sub-projeto)

### 3. Endpoint novo — `EstudoDeCasoController`

`POST /api/estudo-caso/{id}/gerar-texto-ia` (ao lado do `GerarTextoSimuladoAsync` já existente):

1. Busca o `EstudoDeCaso` (mesmos dados usados hoje pelo `MontarTextoSimulado`: eixos, diagnóstico, aluno)
2. Busca o `PromptSistemaIA` ativo do tipo `EstudoCaso`
3. Monta o prompt do usuário com os dados estruturados do caso
4. Chama `IGeradorTextoIA.GerarTextoAsync(systemPrompt, prompt)`
5. Salva o resultado em `EstudoDeCaso.TextoGeradoIA` (nova coluna, migration separada)

### 4. Admin (`apps/web`) — aba "Prompts de IA"

- Dentro do grupo "Documentos" já existente no `Sidebar.tsx`
- Lista os 4 tipos de documento, cada um com o prompt ativo editável (textarea) + histórico de versões anteriores (simples: `Ativo = false` nos antigos, não precisa de tela de histórico na v1)
- Reaproveita padrão de `LinksHotmart.tsx` (editar → salvar → confirmação)

## Anti-repetição (queixa recorrente das professoras hoje)

O texto mecânico atual (`MontarTextoSimulado`) repete frases de conexão fixas idênticas em todo estudante (ex.: "Perfil de autonomia identificado na avaliação diagnóstica: X."), porque é concatenação de template, não redação. A geração por IA resolve isso por natureza — cada chamada produz prosa original a partir do dado real daquele caso.

Ressalva: um LLM mal calibrado introduz repetição própria (jargão de preenchimento genérico: "é importante ressaltar", "nesse sentido", etc., repetidos entre casos diferentes). O system prompt do tipo `EstudoCaso` deve instruir explicitamente:

- Sintetizar a partir dos dados reais do caso, nunca gerar texto genérico de enchimento
- Variar a redação entre gerações — não reutilizar fórmulas de conexão fixas
- Usar o exemplo do caso "Antônio" (Caderno Pedagógico) só como referência de tom/estrutura, nunca copiar frases dele literalmente

## Erros e limites

- Se a chamada ao Gemini falhar (rate limit do free tier, timeout): retorna erro amigável, não quebra o fluxo — professora pode tentar de novo ou continuar usando o texto mecânico existente
- Se não houver `PromptSistemaIA` ativo pro tipo `EstudoCaso`: erro claro pedindo pra gestora cadastrar um antes de gerar

## Fora de escopo (fica pros próximos sub-projetos)

- PAEE, Avaliação Diagnóstica, Relato de Atendimento — mesma arquitetura, specs separadas
- Implementação real de `ClaudeGeradorTextoIA`
- Remoção do texto mecânico legado (`MontarTextoSimulado` / `TextoSimulado`) — só depois de validado
- Tela de histórico/versionamento de prompts (v1 é só "prompt ativo atual")
