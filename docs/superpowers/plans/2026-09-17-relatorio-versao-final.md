# Relatório Pedagógico — Versão Final com Revisão por IA — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remover notas manuais e reescrita de seção por IA do Relatório Pedagógico, e fazer o botão Finalizar escolher o formato do documento e disparar uma revisão por IA apenas nas seções que a professora editou.

**Architecture:** A tela de detalhe do relatório (`RelatorioDetailPage`) perde o campo de notas manuais e o botão "Reescrever com IA". O Finalizar passa a pedir o formato (Tópicos ou Texto corrido) e, quando há seções editadas — ou quando o formato é Texto corrido — enfileira uma revisão que roda no worker de background já existente, usando o mesmo `IGeradorTextoIA` que a reescrita usava. A proposta da IA é persistida em campos separados para a professora aceitar ou descartar sem perder o texto que escreveu.

**Tech Stack:** .NET 8 + EF Core (`apps/api`), React 19 + Vite + TanStack Query + Tailwind (`apps/web-app`), Vitest + Testing Library, Gemini via `GeminiGeradorTextoIA`.

**Spec:** `docs/superpowers/specs/2026-09-17-relatorio-versao-final-design.md`

## Global Constraints

- **Git é do usuário.** Nenhum passo deste plano executa `git add`, `commit`, `push`, `merge` ou troca de branch. Os passos de commit trazem a mensagem sugerida para o usuário rodar.
- **Nada de servidor, build, lint ou teste rodado automaticamente.** Os comandos estão escritos nos passos para o usuário executar.
- **Sem testes automatizados no backend.** `apps/api.Tests` está vazio — o projeto não tem suíte .NET. Tasks de backend trazem roteiro de verificação manual. Não criar projeto de testes .NET sem autorização explícita.
- **TDD vale para o `web-app`**, onde existe Vitest configurado (`pnpm --filter web-app test:run`).
- **Padrão de serviço na API:** todo método público de service devolve `ServiceResponse<T>`, usando `SetFalha`, `AdicionaObjeto` e `AdicionaMensagem`.
- **Escopo de acesso:** toda query de relatório filtra por `ProfessorId` do usuário autenticado (`usuario.ProfessorId`).
- **Nomenclatura:** código, nomes de campos e mensagens em português, seguindo o que já existe nos arquivos tocados.
- **Comentário só para decisão arquitetural ou lógica não óbvia** — sem comentário descrevendo o que a linha já diz.
- **Seção editada** = `TextoEditado` preenchido e diferente de `TextoGerado`, comparando com `Trim()`. Essa definição é usada em backend e front e não pode divergir entre eles.

---

## Fase 1 — Remoção de notas manuais e reescrita por IA

Entregável fechado: pode ir para produção sozinho, sem nenhuma IA nova.

### Task 1: Front — remover notas manuais e reescrita da tela e do service

**Files:**
- Modify: `apps/web-app/src/types/relatorio.ts`
- Modify: `apps/web-app/src/services/relatorioService.ts:87-104`
- Modify: `apps/web-app/src/services/relatorioService.test.ts:195-225`
- Modify: `apps/web-app/src/lib/relatorioSecoesExport.ts`
- Modify: `apps/web-app/src/lib/relatorioSecoesExport.test.ts`
- Modify: `apps/web-app/src/pages/relatorio/RelatorioDetailPage.tsx`

**Interfaces:**
- Consumes: nada de tasks anteriores.
- Produces: `RelatorioSecao` sem `notasManuais`; `atualizarSecaoRelatorio(id, { secaoChave, textoEditado })`; `montarSecoesRelatorioParaExport(secoes)` com precedência `textoEditado` → `textoGerado`.

- [ ] **Step 1: Ajustar o teste do export para a nova regra (RED)**

Em `apps/web-app/src/lib/relatorioSecoesExport.test.ts`, o helper `secao()` perde `notasManuais: null` e os casos que testavam a incorporação da nota viram um caso só, que garante que o texto editado vence o gerado:

```ts
it('usa o texto editado quando existe, ignorando o gerado', () => {
  const resultado = montarSecoesRelatorioParaExport([
    secao(1, { textoGerado: 'Texto da IA.', textoEditado: 'Texto da professora.' }),
  ])

  expect(resultado).toHaveLength(1)
  expect(resultado[0].corpo).toBe('Texto da professora.')
})

it('cai no texto gerado quando a professora não editou', () => {
  const resultado = montarSecoesRelatorioParaExport([secao(1, { textoGerado: 'Texto da IA.' })])

  expect(resultado[0].corpo).toBe('Texto da IA.')
})

it('omite seção sem nenhum texto', () => {
  const resultado = montarSecoesRelatorioParaExport([secao(1, {}), secao(2, { textoGerado: 'Tem texto.' })])

  expect(resultado).toHaveLength(1)
  expect(resultado[0].titulo).toBe('2. Potencialidades, interesses e formas de aprendizagem')
})
```

- [ ] **Step 2: Rodar o teste e confirmar que falha**

Run: `pnpm --filter web-app test:run src/lib/relatorioSecoesExport.test.ts`
Expected: FAIL — o helper `secao()` ainda exige `notasManuais` no tipo `RelatorioSecao`.

- [ ] **Step 3: Remover `notasManuais` do tipo**

Em `apps/web-app/src/types/relatorio.ts`, apagar a linha `notasManuais: string | null` de `RelatorioSecao` e apagar as interfaces `RelatorioSecaoReescrita` e `RelatorioSecaoReescritaResponse` inteiras.

- [ ] **Step 4: Remover a incorporação da nota do export**

Em `apps/web-app/src/lib/relatorioSecoesExport.ts`, apagar a função `incorporarNotasManuais` e trocar o corpo do `forEach`:

```ts
RELATORIO_SECAO_ORDEM.forEach((chave) => {
  const secao = secoesPorChave.get(chave)
  const corpo = (secao?.textoEditado ?? secao?.textoGerado ?? '').trim()
  if (!corpo) return

  resultado.push({
    titulo: `${PRIMEIRA_SECAO_NUMERADA + resultado.length}. ${RELATORIO_SECAO_LABELS[chave]}`,
    corpo,
  })
})
```

No comentário de topo do arquivo, apagar a frase sobre notas manuais incorporadas ao texto e manter a regra de seção vazia não aparecer no documento.

- [ ] **Step 5: Rodar o teste e confirmar que passa**

Run: `pnpm --filter web-app test:run src/lib/relatorioSecoesExport.test.ts`
Expected: PASS nos três casos.

- [ ] **Step 6: Remover a reescrita do service**

Em `apps/web-app/src/services/relatorioService.ts`, apagar a função `reescreverSecaoRelatorio` inteira (com o comentário acima dela) e os imports `RelatorioSecaoReescrita` e `RelatorioSecaoReescritaResponse`. Em `atualizarSecaoRelatorio`, o payload fica:

```ts
export const atualizarSecaoRelatorio = async (
  id: number,
  payload: { secaoChave: RelatorioSecaoChaveCodigo; textoEditado?: string | null }
): Promise<Relatorio> => {
```

- [ ] **Step 7: Ajustar os testes do service**

Em `apps/web-app/src/services/relatorioService.test.ts`, apagar os casos que cobrem `reescreverSecaoRelatorio` e tirar `notasManuais` dos payloads de `atualizarSecaoRelatorio`, deixando a asserção do corpo enviado como:

```ts
expect(post).toHaveBeenCalledWith('/Relatorio/5/secoes', { secaoChave: 0, textoEditado: 'X' })
```

Confirme o verbo e a rota olhando a implementação atual antes de escrever a asserção — não mude o contrato nesta task.

- [ ] **Step 8: Limpar a tela de detalhe**

Em `apps/web-app/src/pages/relatorio/RelatorioDetailPage.tsx`, remover:

- o import `reescreverSecaoRelatorio` e o ícone `Sparkle`;
- o estado `sugestoesIA` e a função `descartarSugestao`;
- a mutation `reescreverSecaoMutation` inteira;
- a constante `reescrevendo` e a constante `sugestaoIA` dentro do `map`;
- o bloco JSX `{sugestaoIA && ( ... )}` inteiro;
- o campo de notas manuais: label, parágrafo de ajuda e `<textarea>`;
- o botão "Reescrever com IA" (o `<div className="flex flex-wrap items-center justify-between gap-2">` passa a conter só o botão de salvar, com `justify-end`).

`SecaoDraft` fica com um campo só:

```ts
interface SecaoDraft {
  textoEditado: string
}
```

E as funções auxiliares acompanham:

```ts
function secaoPersistida(secao: RelatorioSecao | undefined): SecaoDraft {
  return { textoEditado: secao?.textoEditado ?? secao?.textoGerado ?? '' }
}

function temAlteracaoPendente(secao: RelatorioSecao | undefined, draft: SecaoDraft): boolean {
  return secaoPersistida(secao).textoEditado !== draft.textoEditado
}
```

`salvarSecaoMutation` manda só `textoEditado`.

- [ ] **Step 9: Rodar a suíte inteira do web-app**

Run: `pnpm --filter web-app test:run`
Expected: PASS. Qualquer falha em `RelatorioDetailPage.test.tsx` é por referência a notas manuais ou reescrita — ajuste o teste, não o comportamento.

- [ ] **Step 10: Typecheck e lint**

Run: `pnpm --filter web-app typecheck && pnpm --filter web-app lint`
Expected: sem erros. Import órfão de `Sparkle` ou de tipos apagados aparece aqui.

- [ ] **Step 11: Commit (usuário executa)**

```
refactor(web-app): remove notas manuais e reescrita de seção com IA do relatório
```

---

### Task 2: API — remover o recurso de reescrita e o campo de notas

**Files:**
- Delete: `apps/api/DTOs/Relatorio/RelatorioSecaoReescreverDTO.cs`
- Delete: `apps/api/DTOs/Relatorio/RelatorioSecaoReescritaDTO.cs`
- Modify: `apps/api/Models/RelatorioSecao.cs`
- Modify: `apps/api/DTOs/Relatorio/RelatorioSecaoDTO.cs`
- Modify: `apps/api/DTOs/Relatorio/RelatorioSecaoAtualizarDTO.cs`
- Modify: `apps/api/Services/RelatorioService.cs:535,676,706-808`
- Modify: `apps/api/Controllers/RelatorioController.cs:114-127`
- Modify: `apps/web/src/pages/Documentos/PromptsIA.tsx:14`

**Interfaces:**
- Consumes: nada.
- Produces: `RelatorioSecao` sem `NotasManuais`; `RelatorioSecaoDTO` sem `NotasManuais`; ausência de `ReescreverSecaoAsync` e da rota `secoes/reescrever`.

- [ ] **Step 1: Apagar os DTOs da reescrita**

Apagar os dois arquivos listados acima.

- [ ] **Step 2: Remover o endpoint**

Em `apps/api/Controllers/RelatorioController.cs`, apagar o método `ReescreverSecao` inteiro, com seu atributo `[HttpPost("{id:int}/secoes/reescrever")]`.

- [ ] **Step 3: Remover o serviço de reescrita**

Em `apps/api/Services/RelatorioService.cs`, apagar `MontarPromptReescritaSecao` e `ReescreverSecaoAsync` inteiros. **Manter** o dicionário `SecaoRotulos` — ele volta a ser usado na Fase 3. Ajustar o comentário de `SecaoRotulos` que hoje diz "qual seção ela está reescrevendo" para dizer que os rótulos identificam a seção para a IA.

- [ ] **Step 4: Remover o campo do model e dos DTOs**

- `Models/RelatorioSecao.cs`: apagar a propriedade `NotasManuais` e seu comentário.
- `DTOs/Relatorio/RelatorioSecaoDTO.cs`: apagar `NotasManuais`.
- `DTOs/Relatorio/RelatorioSecaoAtualizarDTO.cs`: apagar `NotasManuais`.
- `Services/RelatorioService.cs:535`: apagar `NotasManuais = s.NotasManuais,` do mapeamento.
- `Services/RelatorioService.cs:676`: apagar a linha `secao.NotasManuais = ...` de `AtualizarSecaoAsync`.

- [ ] **Step 5: Escrever a migration com preservação de conteúdo**

Criar a migration (comando para o usuário rodar, na pasta `apps/api`):

```
dotnet ef migrations add RemoveNotasManuaisRelatorioSecao
```

No `Up` gerado, **antes** do `DropColumn`, inserir o SQL que concatena a nota ao texto seguindo a regra que o export usava:

```csharp
migrationBuilder.Sql(@"
    UPDATE relatorio_secoes
    SET texto_editado = CASE
        WHEN COALESCE(TRIM(notas_manuais), '') = '' THEN texto_editado
        WHEN COALESCE(TRIM(texto_editado), '') = '' THEN TRIM(notas_manuais)
        WHEN TRIM(texto_editado) ~ '[.!?:;]$' THEN TRIM(texto_editado) || ' ' || TRIM(notas_manuais)
        ELSE TRIM(texto_editado) || '. ' || TRIM(notas_manuais)
    END
    WHERE COALESCE(TRIM(notas_manuais), '') <> '';
");
```

Confirme os nomes reais das colunas no arquivo gerado (o projeto pode usar `NotasManuais`/`TextoEditado` em vez de snake_case) e ajuste o SQL para bater com o que o EF gerou. O `Down` recria a coluna vazia — o conteúdo concatenado não é separável de volta, e isso precisa estar num comentário na migration.

- [ ] **Step 6: Verificação manual**

1. Backup do banco antes de aplicar (a migration é destrutiva).
2. `dotnet build` na pasta `apps/api` — deve compilar sem erro.
3. `dotnet ef database update` num banco de desenvolvimento **com dado de teste**: crie antes uma seção com `TextoEditado = 'Leo avançou'` e `NotasManuais = 'Faltou três vezes.'`, e confirme que depois da migration o texto virou `Leo avançou. Faltou três vezes.`
4. Repita com `TextoEditado` vazio (resultado: só a nota) e com nota vazia (resultado: texto intacto).
5. `GET /Relatorio/{id}` não deve mais trazer `notasManuais`.
6. `POST /Relatorio/{id}/secoes/reescrever` deve responder 404.

- [ ] **Step 7: Atualizar o rótulo no admin**

Em `apps/web/src/pages/Documentos/PromptsIA.tsx:14`, trocar o texto do rótulo de `RelatorioSecaoReescrita` para `'Relatório Pedagógico — revisão final do texto'`. A chave do enum é renomeada na Fase 3; nesta task só o texto muda.

- [ ] **Step 8: Commit (usuário executa)**

```
refactor(api): remove reescrita de seção com IA e campo de notas manuais do relatório
```

---

## Fase 2 — Estrutura da versão final

### Task 3: Campos, enums e DTOs da versão final

**Files:**
- Modify: `apps/api/Models/Relatorio.cs`
- Modify: `apps/api/Models/RelatorioSecao.cs`
- Modify: `apps/api/DTOs/Relatorio/RelatorioSecaoDTO.cs`
- Modify: `apps/api/DTOs/Relatorio/RelatorioBuscarDTO.cs`
- Create: `apps/api/DTOs/Relatorio/RelatorioFinalizarDTO.cs`
- Modify: `apps/api/Services/RelatorioService.cs` (mapeamento em `MapToBuscarDtoAsync`)

**Interfaces:**
- Consumes: Task 2 (campo `NotasManuais` já removido).
- Produces: `RelatorioFormatoFinal { Topicos = 0, TextoCorrido = 1 }`; `RelatorioStatus.RevisaoFinal = 4`; `Relatorio.FormatoFinal`, `Relatorio.TextoFinal`, `Relatorio.TextoFinalGeradoEm`; `RelatorioSecao.TextoRevisado`; `RelatorioFinalizarDTO { RelatorioFormatoFinal Formato }`.

- [ ] **Step 1: Adicionar o enum de formato e o status**

Em `apps/api/Models/Relatorio.cs`:

```csharp
public enum RelatorioFormatoFinal
{
    Topicos = 0,
    TextoCorrido = 1,
}
```

E no enum `RelatorioStatus`, acrescentar `RevisaoFinal = 4` com comentário explicando que cobre tanto a revisão na fila quanto a proposta aguardando decisão, distinguidas por `TextoFinalGeradoEm`.

- [ ] **Step 2: Adicionar os campos ao model**

Em `Relatorio`:

```csharp
public RelatorioFormatoFinal? FormatoFinal { get; set; }

[Column(TypeName = "text")]
public string? TextoFinal { get; set; }

public DateTime? TextoFinalGeradoEm { get; set; }
```

Em `RelatorioSecao`:

```csharp
[Column(TypeName = "text")]
public string? TextoRevisado { get; set; }
```

- [ ] **Step 3: Refletir nos DTOs**

- `RelatorioSecaoDTO`: acrescentar `public string? TextoRevisado { get; set; }`.
- `RelatorioBuscarDTO`: acrescentar `FormatoFinal`, `TextoFinal` e `TextoFinalGeradoEm` com os mesmos tipos do model.
- Criar `apps/api/DTOs/Relatorio/RelatorioFinalizarDTO.cs`:

```csharp
namespace api.DTOs.Relatorio;

public class RelatorioFinalizarDTO
{
    public RelatorioFormatoFinal Formato { get; set; }
}
```

Use o mesmo cabeçalho de namespace e o mesmo estilo dos DTOs vizinhos da pasta.

- [ ] **Step 4: Mapear no `MapToBuscarDtoAsync`**

Acrescentar `FormatoFinal`, `TextoFinal` e `TextoFinalGeradoEm` no objeto do relatório e `TextoRevisado = s.TextoRevisado,` no `Select` das seções.

- [ ] **Step 5: Migration**

```
dotnet ef migrations add AddVersaoFinalRelatorio
```

Revisar o arquivo gerado: só `AddColumn` — nenhuma coluna existente pode aparecer em `DropColumn` ou `AlterColumn`. Se aparecer, o model divergiu e o erro está no passo anterior.

- [ ] **Step 6: Verificação manual**

1. `dotnet build` limpo.
2. `dotnet ef database update` num banco de desenvolvimento.
3. `GET /Relatorio/{id}` de um relatório existente traz `formatoFinal: null`, `textoFinal: null`, `textoFinalGeradoEm: null` e `textoRevisado: null` em cada seção, sem quebrar nada.

- [ ] **Step 7: Commit (usuário executa)**

```
feat(api): adiciona campos de versão final e status de revisão ao relatório
```

---

### Task 4: Fila com tipo de processamento

**Files:**
- Modify: `apps/api/Services/IRelatorioGeracaoQueue.cs`
- Modify: `apps/api/Services/RelatorioGeracaoQueue.cs`
- Modify: `apps/api/Services/RelatorioGeracaoWorker.cs`
- Modify: `apps/api/Services/RelatorioService.cs` (chamadas de `Enfileirar`)

**Interfaces:**
- Consumes: Task 3 (status `RevisaoFinal`).
- Produces: `RelatorioProcessamento { Geracao, RevisaoFinal }`; `IRelatorioGeracaoQueue.Enfileirar(int relatorioId, RelatorioProcessamento tipo)`; `ConsumirAsync` devolvendo `(int RelatorioId, RelatorioProcessamento Tipo)`.

- [ ] **Step 1: Trocar o contrato da fila**

`apps/api/Services/IRelatorioGeracaoQueue.cs`:

```csharp
namespace api.Services;

public enum RelatorioProcessamento
{
    Geracao = 0,
    RevisaoFinal = 1,
}

public interface IRelatorioGeracaoQueue
{
    void Enfileirar(int relatorioId, RelatorioProcessamento tipo);
    IAsyncEnumerable<(int RelatorioId, RelatorioProcessamento Tipo)> ConsumirAsync(CancellationToken cancellationToken);
}
```

- [ ] **Step 2: Ajustar a implementação**

`apps/api/Services/RelatorioGeracaoQueue.cs` troca `Channel<int>` por `Channel<(int RelatorioId, RelatorioProcessamento Tipo)>` e escreve a tupla. O comentário de topo sobre fila em memória e recuperação manual continua válido — mantenha.

- [ ] **Step 3: Rotear no worker**

`apps/api/Services/RelatorioGeracaoWorker.cs`:

```csharp
await foreach (var item in _queue.ConsumirAsync(stoppingToken))
{
    try
    {
        using var scope = _scopeFactory.CreateScope();
        var relatorioService = scope.ServiceProvider.GetRequiredService<RelatorioService>();

        if (item.Tipo == RelatorioProcessamento.RevisaoFinal)
        {
            await relatorioService.ProcessarRevisaoFinalAsync(item.RelatorioId);
        }
        else
        {
            await relatorioService.ProcessarGeracaoAsync(item.RelatorioId);
        }
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Falha ao processar {Tipo} em background do relatório {RelatorioId}", item.Tipo, item.RelatorioId);
    }
}
```

`ProcessarRevisaoFinalAsync` só existe na Task 6. Para esta task compilar, crie o método já em `RelatorioService` com corpo `await Task.CompletedTask;` e um comentário `// implementado na Task 6`, e remova o comentário lá.

- [ ] **Step 4: Atualizar as chamadas existentes**

Em `RelatorioService.cs`, toda chamada `_queue.Enfileirar(id)` vira `_queue.Enfileirar(id, RelatorioProcessamento.Geracao)`. Procure por `Enfileirar(` para não deixar nenhuma para trás.

- [ ] **Step 5: Verificação manual**

1. `dotnet build` limpo.
2. Subir a API e gerar um relatório novo pelo wizard: o fluxo de geração precisa continuar funcionando igual (status `Gerando` e depois seções preenchidas). Essa task não muda comportamento nenhum — se mudou, tem bug.

- [ ] **Step 6: Commit (usuário executa)**

```
refactor(api): fila de relatório passa a carregar o tipo de processamento
```

---

## Fase 3 — Revisão por IA

### Task 5: Prompt de sistema da revisão final

**Files:**
- Modify: `apps/api/Models/TipoDocumentoIA.cs`
- Create: `apps/api/Migrations/<timestamp>_AddPromptSistemaIARelatorioTextoFinal.cs` (via `dotnet ef migrations add`)
- Modify: `apps/web/src/pages/Documentos/PromptsIA.tsx`

**Interfaces:**
- Consumes: Task 2 (reescrita já removida).
- Produces: `TipoDocumentoIA.RelatorioTextoFinal = 5` com prompt cadastrado em `prompt_sistema_ia`.

- [ ] **Step 1: Renomear o tipo de documento**

Em `apps/api/Models/TipoDocumentoIA.cs`, trocar `RelatorioSecaoReescrita = 5` por `RelatorioTextoFinal = 5`, com comentário explicando que revisa o texto editado pela professora e aplica o formato escolhido, sem gerar conteúdo novo. Corrigir as referências que o compilador apontar.

Em `apps/web/src/pages/Documentos/PromptsIA.tsx`, renomear a chave `RelatorioSecaoReescrita` para `RelatorioTextoFinal` (o rótulo já foi ajustado na Task 2).

- [ ] **Step 2: Criar a migration do prompt**

```
dotnet ef migrations add AddPromptSistemaIARelatorioTextoFinal
```

Use `apps/api/Migrations/20260911120000_AddPromptSistemaIARelatorioSecaoReescrita.cs` como referência de formato (`migrationBuilder.Sql` com UPDATE/INSERT no `prompt_sistema_ia` para o tipo 5). O `Up` substitui o conteúdo do tipo 5 pelo prompt abaixo; o `Down` restaura o prompt antigo de reescrita.

- [ ] **Step 3: Conteúdo do prompt**

```
Você é revisor de texto de Relatório Pedagógico do Atendimento Educacional Especializado (AEE). Sua função é melhorar a redação de trechos escritos por uma professora do AEE, aplicando vocabulário técnico e pedagógico adequado.

REGRAS INVIOLÁVEIS
- Não acrescente nenhuma informação que não esteja no texto original.
- Não infira diagnóstico, hipótese clínica, causa ou prognóstico.
- Não altere fatos, datas, números, frequências, nomes ou resultados.
- Não remova informação presente no original.
- Não invente exemplo, atividade, recurso ou resultado.
- Mantenha aproximadamente a mesma extensão do texto original.
- Não escreva comentário, título, introdução, conclusão ou explicação sobre o que você fez.
- Nunca deixe marcador de preenchimento no texto (como [habilidade] ou [área]): o texto entregue precisa estar pronto para leitura.

COMO ESCREVER
- Frases curtas e objetivas.
- Verbos de ação: observou, ampliou, demonstrou, apresentou, passou a, necessita.
- Linguagem neutra e técnica.
- Foco no comportamento observável: o que aconteceu, em que contexto, com qual apoio e qual foi a resposta do estudante.
- Sem julgamento, rótulo ou interpretação sem evidência.
- Nunca transforme uma observação pontual em característica permanente do estudante.
- Estruture na tríade Ação + Contexto + Impacto.
- Use conectores de período quando couber: "No início do período...", "Ao longo das intervenções...", "Atualmente...", "Ainda apresenta...", "De modo geral...".

SUBSTITUIÇÕES OBRIGATÓRIAS
Se o texto contiver expressão da coluna EVITE, reescreva no padrão da coluna PREFIRA, preservando o fato relatado.
- EVITE "É preguiçoso." PREFIRA "Em algumas atividades, demonstra pouca iniciativa para iniciar ou concluir as propostas, necessitando de incentivo e mediação."
- EVITE "É agressivo." PREFIRA "Em determinadas situações de frustração ou desconforto, apresenta o comportamento descrito no registro."
- EVITE "Não presta atenção." PREFIRA "Apresenta dificuldade para manter a atenção durante períodos prolongados, necessitando de redirecionamentos em alguns momentos."
- EVITE "Não aprende." PREFIRA "Ainda necessita de diferentes estratégias, recursos e oportunidades de aprendizagem para desenvolver as habilidades da área relatada."
- EVITE "Não consegue fazer nada sozinho." PREFIRA "Necessita de apoio para realizar algumas etapas das atividades, apresentando maior independência em tarefas já conhecidas."
- EVITE "É muito lento." PREFIRA "Necessita de tempo ampliado para compreender as orientações, organizar sua resposta e concluir determinadas atividades."
- EVITE "É desobediente." PREFIRA "Em algumas situações, apresenta dificuldade para seguir os combinados e necessita de mediação para compreender e realizar o que foi proposto."
- EVITE "Faz birra." PREFIRA "Diante de determinadas situações de frustração, espera ou mudança, pode apresentar o comportamento descrito no registro, necessitando de apoio para reorganizar-se."
- EVITE "É antissocial." PREFIRA "Apresenta menor iniciativa para interações sociais em alguns contextos, participando com maior segurança quando há mediação e previsibilidade."
- EVITE "Não fala." PREFIRA "Comunica-se predominantemente pelos recursos descritos no registro, utilizando-os para expressar necessidades e interesses."
- EVITE "Não entende nada." PREFIRA "Demonstra melhor compreensão quando as informações são apresentadas de forma objetiva, segmentada e acompanhadas de recursos de apoio."
- EVITE "É muito dependente." PREFIRA "Ainda necessita de apoio na situação relatada, sendo importante ampliar gradativamente as oportunidades de realização com maior autonomia."
- EVITE "Tem comportamento inadequado." PREFIRA "No contexto relatado, apresenta o comportamento observável descrito, sendo necessária mediação."
- EVITE "Não evoluiu." PREFIRA "No período observado, ainda não foram identificados avanços consistentes na habilidade relatada, indicando a necessidade de continuidade e revisão das estratégias utilizadas."
- EVITE "Não tem interesse." PREFIRA "Apresenta menor envolvimento em determinadas propostas, respondendo de maneira mais participativa quando são utilizados os recursos descritos."
- EVITE "É incapaz de realizar a atividade." PREFIRA "Neste momento, necessita do apoio descrito para realizar a atividade, sendo importante continuar oferecendo oportunidades para o desenvolvimento dessa habilidade."

SITUAÇÕES SENSÍVEIS
- Ausências: "A frequência irregular impactou a continuidade das intervenções."
- Pouco avanço: "A evolução ocorreu em ritmo próprio, com pequenas conquistas pontuais."
- Desorganização: "Apresenta episódios de desorganização diante de tarefas desafiadoras."
- Apoio familiar limitado: "A devolutiva das atividades enviadas ocorreu de forma parcial."
Use essas formulações como referência de tom. Não as insira se o assunto não estiver no texto original.

FORMATO DA RESPOSTA
O prompt do usuário informa o modo.

MODO TOPICOS: devolva cada seção precedida da linha [[SECAO:n]], usando exatamente o número recebido, seguida do texto revisado. Sem título de seção, sem markdown, sem numeração própria. Devolva apenas as seções recebidas.

MODO TEXTO_CORRIDO: devolva um único texto contínuo, em parágrafos, unindo as seções recebidas na ordem em que aparecem, sem títulos e sem marcadores. Use os conectores de período para dar fluidez entre os assuntos. Não repita informação que já apareceu.
```

- [ ] **Step 4: Verificação manual**

1. `dotnet build` limpo.
2. `dotnet ef database update`.
3. Abrir Prompts de IA em `apps/web` com usuária gestora: o prompt novo aparece com o rótulo "Relatório Pedagógico — revisão final do texto" e é editável e salvável.

- [ ] **Step 5: Commit (usuário executa)**

```
feat(api): substitui prompt de reescrita de seção pelo prompt de revisão final do relatório
```

---

### Task 6: Serviço de revisão final

**Files:**
- Modify: `apps/api/Services/RelatorioService.cs`
- Modify: `apps/api/Controllers/RelatorioController.cs`

**Interfaces:**
- Consumes: Tasks 3, 4 e 5.
- Produces:
  - `Task<ServiceResponse<RelatorioBuscarDTO>> SolicitarRevisaoFinalAsync(int id, RelatorioFinalizarDTO dto, Usuario usuario)`
  - `Task ProcessarRevisaoFinalAsync(int relatorioId)`
  - `Task<ServiceResponse<RelatorioBuscarDTO>> AceitarRevisaoFinalAsync(int id, Usuario usuario)`
  - `Task<ServiceResponse<RelatorioBuscarDTO>> DescartarRevisaoFinalAsync(int id, Usuario usuario)`
  - Rotas `POST /Relatorio/{id}/finalizar` (com corpo), `POST /Relatorio/{id}/revisao-final/aceitar`, `POST /Relatorio/{id}/revisao-final/descartar`.

- [ ] **Step 1: Helper de seção editada**

Em `RelatorioService`, acima de `FinalizarAsync`:

```csharp
private static bool FoiEditada(RelatorioSecao secao)
{
    var editado = secao.TextoEditado?.Trim() ?? string.Empty;
    if (editado.Length == 0) return false;
    return editado != (secao.TextoGerado?.Trim() ?? string.Empty);
}
```

- [ ] **Step 2: Rotear a finalização**

`FinalizarAsync` vira `SolicitarRevisaoFinalAsync(int id, RelatorioFinalizarDTO dto, Usuario usuario)`, mantendo as validações atuais (professor identificado, relatório encontrado, relatório já gerado) e acrescentando:

```csharp
if (relatorio.Status == RelatorioStatus.RevisaoFinal)
{
    resposta.SetFalha("Este relatório já tem uma revisão final em andamento.");
    return resposta;
}

var secoes = await _db.RelatorioSecoes.Where(s => s.RelatorioId == id).ToListAsync();
var temEdicao = secoes.Any(FoiEditada);

relatorio.FormatoFinal = dto.Formato;
relatorio.UpdatedAt = DateTime.UtcNow;

if (dto.Formato == RelatorioFormatoFinal.Topicos && !temEdicao)
{
    relatorio.Status = RelatorioStatus.Finalizado;
    await _db.SaveChangesAsync();

    resposta.AdicionaObjeto(await MapToBuscarDtoAsync(id));
    resposta.AdicionaMensagem("Relatório finalizado.");
    return resposta;
}

relatorio.Status = RelatorioStatus.RevisaoFinal;
relatorio.TextoFinal = null;
relatorio.TextoFinalGeradoEm = null;
await _db.SaveChangesAsync();

_queue.Enfileirar(id, RelatorioProcessamento.RevisaoFinal);

resposta.AdicionaObjeto(await MapToBuscarDtoAsync(id));
resposta.AdicionaMensagem("Revisão final em andamento.");
return resposta;
```

- [ ] **Step 3: Montar o prompt de usuário**

```csharp
private static string MontarPromptRevisaoFinal(
    Relatorio relatorio,
    RelatorioFormatoFinal formato,
    IReadOnlyList<RelatorioSecao> secoes)
{
    var sb = new StringBuilder();
    sb.AppendLine(formato == RelatorioFormatoFinal.Topicos ? "MODO: TOPICOS" : "MODO: TEXTO_CORRIDO");
    sb.AppendLine();
    sb.AppendLine($"Estudante: {relatorio.Aluno?.NomeCompleto ?? "não informado"}");
    sb.AppendLine($"Período: {relatorio.DataInicio:dd/MM/yyyy} a {relatorio.DataFim:dd/MM/yyyy} ({relatorio.TipoPeriodo}).");
    sb.AppendLine();

    foreach (var secao in secoes.OrderBy(s => (int)s.SecaoChave))
    {
        sb.AppendLine($"[[SECAO:{(int)secao.SecaoChave}]] {SecaoRotulos[secao.SecaoChave]}");
        sb.AppendLine(TextoAtual(secao));
        sb.AppendLine();
    }

    return sb.ToString();
}

private static string TextoAtual(RelatorioSecao secao) =>
    (secao.TextoEditado ?? secao.TextoGerado ?? string.Empty).Trim();
```

No modo tópicos, `secoes` traz só as editadas. No modo corrido, traz todas as que têm texto.

- [ ] **Step 4: Ler a resposta do modo tópicos**

```csharp
private static Dictionary<int, string> LerSecoesRevisadas(string resposta)
{
    var resultado = new Dictionary<int, string>();
    var partes = Regex.Split(resposta, @"\[\[SECAO:(\d+)\]\]");

    for (var i = 1; i < partes.Length - 1; i += 2)
    {
        if (!int.TryParse(partes[i], out var chave)) continue;
        var texto = partes[i + 1].Trim();
        if (texto.Length > 0) resultado[chave] = texto;
    }

    return resultado;
}
```

Seção que não voltar, ou voltar vazia, simplesmente não entra no dicionário — e no passo seguinte mantém o texto da professora.

- [ ] **Step 5: Processar a revisão**

```csharp
public async Task ProcessarRevisaoFinalAsync(int relatorioId)
{
    var relatorio = await _db.Relatorios
        .Include(r => r.Aluno)
        .FirstOrDefaultAsync(r => r.Id == relatorioId);
    if (relatorio == null || relatorio.Status != RelatorioStatus.RevisaoFinal) return;

    var formato = relatorio.FormatoFinal ?? RelatorioFormatoFinal.Topicos;
    var todas = await _db.RelatorioSecoes
        .Where(s => s.RelatorioId == relatorioId)
        .ToListAsync();

    var alvo = formato == RelatorioFormatoFinal.Topicos
        ? todas.Where(FoiEditada).ToList()
        : todas.Where(s => TextoAtual(s).Length > 0).ToList();

    var systemPrompt = await _promptService.BuscarConteudoAtivoAsync(TipoDocumentoIA.RelatorioTextoFinal);
    if (string.IsNullOrWhiteSpace(systemPrompt) || alvo.Count == 0)
    {
        await FalharRevisaoFinalAsync(relatorio);
        return;
    }

    string resposta;
    try
    {
        resposta = await _geradorTextoIA.GerarTextoAsync(
            systemPrompt,
            MontarPromptRevisaoFinal(relatorio, formato, alvo));
    }
    catch (Exception)
    {
        await _geracaoLog.RegistrarAsync(relatorio.ProfessorId, TipoDocumentoIA.RelatorioTextoFinal, relatorioId, relatorio.AlunoId, sucesso: false);
        await FalharRevisaoFinalAsync(relatorio);
        return;
    }

    resposta = resposta.Trim();
    if (resposta.Length == 0)
    {
        await _geracaoLog.RegistrarAsync(relatorio.ProfessorId, TipoDocumentoIA.RelatorioTextoFinal, relatorioId, relatorio.AlunoId, sucesso: false);
        await FalharRevisaoFinalAsync(relatorio);
        return;
    }

    if (formato == RelatorioFormatoFinal.Topicos)
    {
        var revisadas = LerSecoesRevisadas(resposta);
        foreach (var secao in alvo)
        {
            if (revisadas.TryGetValue((int)secao.SecaoChave, out var texto))
            {
                secao.TextoRevisado = texto;
            }
        }
    }
    else
    {
        relatorio.TextoFinal = resposta;
    }

    relatorio.TextoFinalGeradoEm = DateTime.UtcNow;
    relatorio.UpdatedAt = DateTime.UtcNow;
    await _db.SaveChangesAsync();

    await _geracaoLog.RegistrarAsync(relatorio.ProfessorId, TipoDocumentoIA.RelatorioTextoFinal, relatorioId, relatorio.AlunoId, sucesso: true);
}

private async Task FalharRevisaoFinalAsync(Relatorio relatorio)
{
    relatorio.Status = RelatorioStatus.Rascunho;
    relatorio.FormatoFinal = null;
    relatorio.TextoFinal = null;
    relatorio.TextoFinalGeradoEm = null;
    relatorio.UpdatedAt = DateTime.UtcNow;
    await _db.SaveChangesAsync();
}
```

Confirme a assinatura real de `_geracaoLog.RegistrarAsync` e de `_promptService.BuscarConteudoAtivoAsync` no arquivo antes de escrever — elas estão sendo reaproveitadas exatamente como a antiga `ReescreverSecaoAsync` as usava.

- [ ] **Step 6: Aceitar e descartar**

```csharp
public async Task<ServiceResponse<RelatorioBuscarDTO>> AceitarRevisaoFinalAsync(int id, Usuario usuario)
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

    if (relatorio.Status != RelatorioStatus.RevisaoFinal || relatorio.TextoFinalGeradoEm == null)
    {
        resposta.SetFalha("Não há revisão final aguardando decisão.");
        return resposta;
    }

    relatorio.Status = RelatorioStatus.Finalizado;
    relatorio.UpdatedAt = DateTime.UtcNow;
    await _db.SaveChangesAsync();

    resposta.AdicionaObjeto(await MapToBuscarDtoAsync(id));
    resposta.AdicionaMensagem("Relatório finalizado.");
    return resposta;
}
```

`DescartarRevisaoFinalAsync` tem as mesmas validações e, no lugar do bloco final, limpa a proposta:

```csharp
var secoes = await _db.RelatorioSecoes.Where(s => s.RelatorioId == id).ToListAsync();
foreach (var secao in secoes) secao.TextoRevisado = null;

relatorio.Status = RelatorioStatus.Rascunho;
relatorio.FormatoFinal = null;
relatorio.TextoFinal = null;
relatorio.TextoFinalGeradoEm = null;
relatorio.UpdatedAt = DateTime.UtcNow;
await _db.SaveChangesAsync();

resposta.AdicionaObjeto(await MapToBuscarDtoAsync(id));
resposta.AdicionaMensagem("Revisão descartada — relatório voltou para edição.");
```

- [ ] **Step 7: Controller**

`POST /Relatorio/{id}/finalizar` passa a receber `[FromBody] RelatorioFinalizarDTO dto` e chamar `SolicitarRevisaoFinalAsync`. Acrescentar os dois endpoints novos seguindo o formato dos vizinhos do arquivo (mesmo tratamento de `ServiceResponse` e mesmo retorno):

```csharp
[HttpPost("{id:int}/revisao-final/aceitar")]
public async Task<IActionResult> AceitarRevisaoFinal(int id)

[HttpPost("{id:int}/revisao-final/descartar")]
public async Task<IActionResult> DescartarRevisaoFinal(int id)
```

- [ ] **Step 8: Verificação manual**

Com a API rodando e um relatório gerado:

1. **Tópicos sem edição:** `POST /Relatorio/{id}/finalizar` com `{"formato":0}` → status vai direto para `1` (Finalizado), nenhum registro novo em `GeracaoIALog`.
2. **Tópicos com edição:** edite uma seção, finalize com `{"formato":0}` → status `4`, e em poucos segundos `GET` traz `textoFinalGeradoEm` preenchido e `textoRevisado` **só** na seção editada; as outras continuam `null`.
3. **Texto corrido:** finalize com `{"formato":1}` → `textoFinal` preenchido com o documento inteiro, `textoRevisado` de todas as seções em `null`.
4. **Aceitar:** status vai para `1` e os textos permanecem.
5. **Descartar:** status volta para `0`, `textoRevisado`, `textoFinal`, `formatoFinal` e `textoFinalGeradoEm` zerados, e `textoEditado` intacto.
6. **Falha da IA:** apague o conteúdo do prompt de sistema em Prompts de IA e finalize com edição → status volta para `0` sem travar em `4`.

- [ ] **Step 9: Commit (usuário executa)**

```
feat(api): adiciona revisão final por IA no fechamento do relatório pedagógico
```

---

## Fase 4 — Front da versão final

### Task 7: Tipos e service da versão final

**Files:**
- Modify: `apps/web-app/src/types/relatorio.ts`
- Modify: `apps/web-app/src/services/relatorioService.ts`
- Modify: `apps/web-app/src/services/relatorioService.test.ts`

**Interfaces:**
- Consumes: Task 6 (rotas e contrato).
- Produces: `RelatorioFormatoFinalCodigo`, `RELATORIO_FORMATO_FINAL_LABELS`, campos novos em `Relatorio` e `RelatorioSecao`, e as funções `finalizarRelatorio(id, formato)`, `aceitarRevisaoFinal(id)`, `descartarRevisaoFinal(id)`.

- [ ] **Step 1: Escrever os testes do service (RED)**

Em `apps/web-app/src/services/relatorioService.test.ts`, seguindo o padrão dos casos que já existem no arquivo:

```ts
it('finalizarRelatorio envia o formato escolhido', async () => {
  post.mockResolvedValue({ data: { sucesso: true, objeto: relatorioFake } })

  await finalizarRelatorio(7, 1)

  expect(post).toHaveBeenCalledWith('/Relatorio/7/finalizar', { formato: 1 })
})

it('aceitarRevisaoFinal chama a rota de aceite', async () => {
  post.mockResolvedValue({ data: { sucesso: true, objeto: relatorioFake } })

  await aceitarRevisaoFinal(7)

  expect(post).toHaveBeenCalledWith('/Relatorio/7/revisao-final/aceitar')
})

it('descartarRevisaoFinal chama a rota de descarte', async () => {
  post.mockResolvedValue({ data: { sucesso: true, objeto: relatorioFake } })

  await descartarRevisaoFinal(7)

  expect(post).toHaveBeenCalledWith('/Relatorio/7/revisao-final/descartar')
})
```

Use o mock e o `relatorioFake` no mesmo formato dos testes vizinhos do arquivo.

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `pnpm --filter web-app test:run src/services/relatorioService.test.ts`
Expected: FAIL — `aceitarRevisaoFinal` e `descartarRevisaoFinal` não existem, e `finalizarRelatorio` não aceita o segundo argumento.

- [ ] **Step 3: Tipos**

Em `apps/web-app/src/types/relatorio.ts`, no padrão dos enums que já existem no arquivo:

```ts
/** Alinhado ao enum `RelatorioFormatoFinal` da API. */
export type RelatorioFormatoFinalCodigo = 0 | 1

export const RELATORIO_FORMATO_FINAL_LABELS: Record<RelatorioFormatoFinalCodigo, string> = {
  0: 'Em tópicos',
  1: 'Texto corrido',
}
```

`RELATORIO_STATUS_LABELS` e `RELATORIO_STATUS_BADGE_VARIANT` ganham a chave `4`: rótulo `'Revisão final'`, variante `'default'`. `RelatorioStatusCodigo` vira `0 | 1 | 2 | 3 | 4`.

`RelatorioSecao` ganha `textoRevisado: string | null`. `Relatorio` ganha:

```ts
formatoFinal: RelatorioFormatoFinalCodigo | null
textoFinal: string | null
textoFinalGeradoEm: string | null
```

- [ ] **Step 4: Service**

```ts
export const finalizarRelatorio = async (
  id: number,
  formato: RelatorioFormatoFinalCodigo
): Promise<Relatorio> => {
  const response = await api.post<RelatorioResponse>(`/Relatorio/${id}/finalizar`, { formato })
  ...
}

export const aceitarRevisaoFinal = async (id: number): Promise<Relatorio> => {
  const response = await api.post<RelatorioResponse>(`/Relatorio/${id}/revisao-final/aceitar`)
  ...
}

export const descartarRevisaoFinal = async (id: number): Promise<Relatorio> => {
  const response = await api.post<RelatorioResponse>(`/Relatorio/${id}/revisao-final/descartar`)
  ...
}
```

O corpo de tratamento de erro (`if (!response.data.sucesso) throw new Error(...)`) segue exatamente o das funções vizinhas do arquivo.

- [ ] **Step 5: Rodar e confirmar que passa**

Run: `pnpm --filter web-app test:run src/services/relatorioService.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit (usuário executa)**

```
feat(web-app): adiciona tipos e chamadas da revisão final do relatório
```

---

### Task 8: Diálogo de formato no Finalizar

**Files:**
- Modify: `apps/web-app/src/pages/relatorio/RelatorioDetailPage.tsx`
- Modify: `apps/web-app/src/pages/relatorio/RelatorioDetailPage.test.tsx`

**Interfaces:**
- Consumes: Task 7 (`finalizarRelatorio(id, formato)`, `RELATORIO_FORMATO_FINAL_LABELS`).
- Produces: interação "Finalizar → escolher formato → confirmar" na tela de detalhe.

- [ ] **Step 1: Teste da interação (RED)**

Em `RelatorioDetailPage.test.tsx`, no padrão de render e mock que o arquivo já usa:

```tsx
it('pede o formato antes de finalizar', async () => {
  renderPage({ status: 0, secoes: [secaoFake] })

  await userEvent.click(screen.getByRole('button', { name: /finalizar/i }))

  expect(screen.getByText('Como você quer o documento final?')).toBeInTheDocument()

  await userEvent.click(screen.getByRole('button', { name: 'Texto corrido' }))
  await userEvent.click(screen.getByRole('button', { name: /gerar versão final/i }))

  expect(finalizarRelatorio).toHaveBeenCalledWith(1, 1)
})
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `pnpm --filter web-app test:run src/pages/relatorio/RelatorioDetailPage.test.tsx`
Expected: FAIL — o diálogo não existe.

- [ ] **Step 3: Implementar o diálogo**

Usando `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle` e `DialogFooter` de `@/components/ui/dialog`:

- estado `const [formatoDialogAberto, setFormatoDialogAberto] = useState(false)` e `const [formatoEscolhido, setFormatoEscolhido] = useState<RelatorioFormatoFinalCodigo>(0)`;
- o botão Finalizar passa a abrir o diálogo em vez de chamar a mutation;
- no diálogo, título `Como você quer o documento final?`, dois botões de escolha (variante `outline` quando não selecionado, `default` quando selecionado) com os rótulos de `RELATORIO_FORMATO_FINAL_LABELS`, e uma linha de ajuda curta para cada um: tópicos mantém as seções com título, texto corrido une tudo num texto único;
- botão de confirmação rotulado `Gerar versão final`, com `loading={finalizarMutation.isPending}`, chamando `finalizarMutation.mutate(formatoEscolhido)`;
- `finalizarMutation` passa a receber o formato como variável: `mutationFn: (formato: RelatorioFormatoFinalCodigo) => finalizarRelatorio(Number(id), formato)`, e no `onSuccess` fecha o diálogo e invalida a query.

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `pnpm --filter web-app test:run src/pages/relatorio/RelatorioDetailPage.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit (usuário executa)**

```
feat(web-app): pede o formato do documento ao finalizar o relatório
```

---

### Task 9: Painel de revisão antes/depois

**Files:**
- Create: `apps/web-app/src/pages/relatorio/RelatorioRevisaoFinal.tsx`
- Create: `apps/web-app/src/pages/relatorio/RelatorioRevisaoFinal.test.tsx`
- Modify: `apps/web-app/src/pages/relatorio/RelatorioDetailPage.tsx`

**Interfaces:**
- Consumes: Task 7 (`aceitarRevisaoFinal`, `descartarRevisaoFinal`, campos novos).
- Produces:

```ts
interface RelatorioRevisaoFinalProps {
  relatorio: Relatorio
  aceitando: boolean
  descartando: boolean
  onAceitar: () => void
  onDescartar: () => void
}

export function RelatorioRevisaoFinal(props: RelatorioRevisaoFinalProps): JSX.Element
```

- [ ] **Step 1: Teste do componente (RED)**

```tsx
it('mostra antes e depois de cada seção editada no modo tópicos', () => {
  render(
    <RelatorioRevisaoFinal
      relatorio={relatorioFake({
        formatoFinal: 0,
        textoFinalGeradoEm: '2026-09-17T12:00:00Z',
        secoes: [
          secaoFake(0, { textoEditado: 'Leo é preguiçoso.', textoRevisado: 'Demonstra pouca iniciativa.' }),
          secaoFake(1, { textoGerado: 'Texto da IA.', textoRevisado: null }),
        ],
      })}
      aceitando={false}
      descartando={false}
      onAceitar={vi.fn()}
      onDescartar={vi.fn()}
    />
  )

  expect(screen.getByText('Leo é preguiçoso.')).toBeInTheDocument()
  expect(screen.getByText('Demonstra pouca iniciativa.')).toBeInTheDocument()
  expect(screen.queryByText('Texto da IA.')).not.toBeInTheDocument()
})

it('dispara aceitar e descartar', async () => {
  const onAceitar = vi.fn()
  const onDescartar = vi.fn()
  render(<RelatorioRevisaoFinal {...props({ onAceitar, onDescartar })} />)

  await userEvent.click(screen.getByRole('button', { name: /usar esta versão/i }))
  expect(onAceitar).toHaveBeenCalled()

  await userEvent.click(screen.getByRole('button', { name: /descartar/i }))
  expect(onDescartar).toHaveBeenCalled()
})
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `pnpm --filter web-app test:run src/pages/relatorio/RelatorioRevisaoFinal.test.tsx`
Expected: FAIL — arquivo do componente não existe.

- [ ] **Step 3: Implementar o componente**

- Modo tópicos (`formatoFinal === 0`): percorre `RELATORIO_SECAO_ORDEM`, pula seção sem `textoRevisado`, e para cada uma renderiza duas colunas (`grid md:grid-cols-2 gap-3`, empilhando no mobile) com os rótulos "Seu texto" e "Revisado pela IA", usando `whitespace-pre-wrap`.
- Modo texto corrido (`formatoFinal === 1`): uma coluna com o texto original concatenado (reaproveitando `montarSecoesRelatorioParaExport` para montar o lado esquerdo) e outra com `relatorio.textoFinal`.
- Rodapé com dois botões: `Descartar` (variante `outline`, `loading={descartando}`) e `Usar esta versão` (`loading={aceitando}`).
- Um parágrafo curto explicando que a IA melhorou a redação sem mudar informação.

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `pnpm --filter web-app test:run src/pages/relatorio/RelatorioRevisaoFinal.test.tsx`
Expected: PASS.

- [ ] **Step 5: Ligar na tela de detalhe**

Em `RelatorioDetailPage.tsx`:

- `refetchInterval` passa a considerar os dois estados: `(query) => (query.state.data?.status === 2 || query.state.data?.status === 4 ? 5000 : false)`;
- `const revisando = relatorio.status === 4`;
- quando `revisando && !relatorio.textoFinalGeradoEm`: renderiza o mesmo card de spinner usado no status `Gerando`, com o texto "A Plural está revisando o texto do relatório.";
- quando `revisando && relatorio.textoFinalGeradoEm`: renderiza `<RelatorioRevisaoFinal />` no lugar da lista de seções, ligado a duas mutations novas (`aceitarRevisaoFinalMutation` e `descartarRevisaoFinalMutation`) escritas no mesmo formato das existentes, com toast de sucesso e o tratamento de erro padrão via `getApiErrorFeedback`;
- os botões de ação do cabeçalho (Finalizar, Duplicar, Reabrir) ficam ocultos enquanto `revisando`.

- [ ] **Step 6: Suíte inteira, typecheck e lint**

Run: `pnpm --filter web-app test:run && pnpm --filter web-app typecheck && pnpm --filter web-app lint`
Expected: PASS, sem erros.

- [ ] **Step 7: Commit (usuário executa)**

```
feat(web-app): adiciona painel de revisão final do relatório com antes e depois
```

---

### Task 10: Exportação da versão final

**Files:**
- Modify: `apps/web-app/src/lib/relatorioSecoesExport.ts`
- Modify: `apps/web-app/src/lib/relatorioSecoesExport.test.ts`
- Modify: `apps/web-app/src/lib/exportRelatorioPdf.ts:118`
- Modify: `apps/web-app/src/lib/exportRelatorioDocx.ts:90`

**Interfaces:**
- Consumes: Tasks 7 e 9.
- Produces: `montarSecoesRelatorioParaExport` com precedência `textoRevisado` → `textoEditado` → `textoGerado`; exportadores tratando `textoFinal`.

- [ ] **Step 1: Teste da precedência e do texto corrido (RED)**

```ts
it('prioriza o texto revisado pela IA', () => {
  const resultado = montarSecoesRelatorioParaExport([
    secao(1, { textoGerado: 'IA.', textoEditado: 'Professora.', textoRevisado: 'Revisado.' }),
  ])

  expect(resultado[0].corpo).toBe('Revisado.')
})

it('mantém relatórios antigos, sem revisão, funcionando', () => {
  const resultado = montarSecoesRelatorioParaExport([
    secao(1, { textoGerado: 'IA.', textoEditado: 'Professora.' }),
  ])

  expect(resultado[0].corpo).toBe('Professora.')
})
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `pnpm --filter web-app test:run src/lib/relatorioSecoesExport.test.ts`
Expected: FAIL no primeiro caso — hoje o revisado é ignorado.

- [ ] **Step 3: Implementar a precedência**

```ts
const corpo = (secao?.textoRevisado ?? secao?.textoEditado ?? secao?.textoGerado ?? '').trim()
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `pnpm --filter web-app test:run src/lib/relatorioSecoesExport.test.ts`
Expected: PASS.

- [ ] **Step 5: Tratar o texto corrido nos exportadores**

Em `exportRelatorioPdf.ts` e `exportRelatorioDocx.ts`, antes do `forEach` das seções: quando `relatorio.formatoFinal === 1 && relatorio.textoFinal`, escrever o texto único (quebrando por parágrafo em `\n\n`) sem título de seção, e pular o `montarSecoesRelatorioParaExport`. Nos demais casos, o caminho atual segue inalterado. Os metadados de identificação (`montarCamposIdentificacaoRelatorio`) continuam iguais nos dois formatos.

- [ ] **Step 6: Verificação manual**

1. Finalizar um relatório em tópicos com uma seção editada e baixar PDF e Word: a seção editada sai com o texto revisado, as demais com o texto original, e a numeração continua sequencial.
2. Finalizar outro em texto corrido: os dois documentos saem com o texto único, sem títulos de seção, e com o cabeçalho de identificação intacto.
3. Abrir um relatório finalizado **antes** desta entrega e baixar: precisa sair igual a antes.

- [ ] **Step 7: Suíte inteira, typecheck e lint**

Run: `pnpm --filter web-app test:run && pnpm --filter web-app typecheck && pnpm --filter web-app lint`
Expected: PASS, sem erros.

- [ ] **Step 8: Commit (usuário executa)**

```
feat(web-app): exporta a versão final revisada do relatório em PDF e Word
```

---

## Verificação final (após todas as tasks)

- [ ] Relatório antigo, finalizado antes da entrega, abre e exporta sem erro.
- [ ] Nenhuma referência a `notasManuais`, `NotasManuais`, `reescrever` ou `Reescrita` sobrou fora de migrations: `grep -rn "otasManuais\|eescrev" apps --include='*.ts' --include='*.tsx' --include='*.cs' | grep -v node_modules | grep -v Migrations`
- [ ] Prompts de IA em `apps/web` lista o prompt de revisão final e permite editar.
- [ ] Os cinco caminhos do Step 8 da Task 6 conferidos de ponta a ponta pela interface.
