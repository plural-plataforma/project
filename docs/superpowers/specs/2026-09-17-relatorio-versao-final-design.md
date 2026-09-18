# Relatório Pedagógico — Versão Final com Revisão por IA — Design

## Contexto

O Relatório Pedagógico é gerado por IA em 14 seções (`RelatorioGeracaoWorker` →
`RelatorioService.ProcessarGeracaoAsync`) e depois editado pela professora na tela de
detalhe (`RelatorioDetailPage`). Hoje essa tela tem dois recursos que a cliente pediu
para remover:

- **Notas manuais** por seção (`relatorio_secoes.NotasManuais`): campo separado que só é
  emendado ao texto no momento da exportação (`relatorioSecoesExport.ts`).
- **Reescrever com IA** (`POST /Relatorio/{id}/secoes/reescrever` →
  `RelatorioService.ReescreverSecaoAsync`): pega o texto da seção mais a nota manual e
  devolve uma sugestão para aceitar ou descartar.

No lugar deles entra uma revisão única no fim do processo: ao **Finalizar**, a professora
escolhe o formato do documento e a IA revisa apenas o que ela editou, aplicando o
vocabulário pedagógico dos materiais de referência da cliente.

Motivação da cliente: o texto das seções não editadas já saiu da IA na geração inicial —
revisar de novo é custo sem ganho. O que precisa de revisão é o que a professora escreveu
com as próprias palavras.

**Fora de escopo:** as etapas do wizard de criação (`RelatorioStep1..4`) não mudam;
a geração inicial não muda; nenhuma alteração na tela de listagem de relatórios; nenhuma
tela nova de gestão de vocabulário (o glossário vive no prompt de sistema, editável pela
gestora em Prompts de IA).

## Modelo de dados

**`relatorios_pedagogicos`** (`Models/Relatorio.cs`) ganha:

```
FormatoFinal        RelatorioFormatoFinal?   // Topicos = 0, TextoCorrido = 1
TextoFinal          text?                    // documento único — só no modo TextoCorrido
TextoFinalGeradoEm  datetime?                // nulo = revisão ainda na fila
```

**`relatorio_secoes`** (`Models/RelatorioSecao.cs`):

```
+ TextoRevisado   text?   // proposta da IA para a seção editada
- NotasManuais            // removido
```

`TextoRevisado` existe para preservar o antes/depois: `TextoEditado` continua sendo o que
a professora escreveu, e a comparação na tela de revisão é entre os dois. Depois do aceite
os dois permanecem — o histórico da edição original não se perde.

**Novo status** em `RelatorioStatus`:

```
RevisaoFinal = 4
```

Cobre os dois momentos da revisão, distinguidos por `TextoFinalGeradoEm`:
nulo = na fila / IA rodando (tela mostra spinner, `refetchInterval` igual ao de `Gerando`);
preenchido = proposta pronta, aguardando decisão da professora.

### Migration de dados

Antes de dropar `NotasManuais`, o conteúdo existente é concatenado em `TextoEditado`
seguindo exatamente a regra que `relatorioSecoesExport.ts` aplica hoje na exportação:

1. `TextoEditado` vazio → vira a nota.
2. Nota vazia → nada muda.
3. Ambos preenchidos → `texto` + (`.` se não terminar em `.!?:;`) + ` ` + `nota`.

Sem essa etapa, professoras perdem conteúdo que hoje aparece no PDF/Word. A migration é
escrita em SQL na própria migration (`Up`), não em código C# de aplicação.

## Fluxo

Estado inicial: relatório em `Rascunho`, com as 14 seções geradas e possivelmente editadas.

1. Professora edita o texto direto no campo da seção (sem notas manuais, sem reescrever).
2. Clica **Finalizar** → diálogo pede o formato: **Tópicos** (seções separadas com título,
   igual ao documento de hoje) ou **Texto corrido** (as seções fundidas em texto contínuo).
3. O backend decide:

| Formato | Seções editadas | Ação |
|---|---|---|
| Tópicos | nenhuma | Finaliza na hora, sem IA. Comportamento atual. |
| Tópicos | uma ou mais | Enfileira revisão; IA pole **só as editadas**. |
| Texto corrido | qualquer | Enfileira revisão; IA funde as 14 seções e pole as editadas no mesmo passe. |

4. Com revisão enfileirada, status vira `RevisaoFinal` e a tela mostra spinner.
5. Worker roda a IA e grava `TextoRevisado` (por seção) ou `TextoFinal` (modo corrido),
   mais `TextoFinalGeradoEm`.
6. Tela mostra o **antes/depois**: no modo tópicos, um par por seção editada; no modo
   corrido, o texto original concatenado ao lado do texto final.
7. **Aceitar** → status `Finalizado` e a exportação passa a usar a versão revisada
   (`FormatoFinal` já foi gravado no passo 3). **Descartar** → limpa `TextoRevisado`,
   `TextoFinal`, `TextoFinalGeradoEm` e `FormatoFinal`, status volta a `Rascunho`.

**Seção editada** = `TextoEditado` preenchido e diferente de `TextoGerado` (comparação por
`Trim()`). Mesma regra que o front já usa para o badge "Salvo / Alterações não salvas".

Falha da IA no worker: status volta a `Rascunho`, campos limpos, e a mensagem de erro
segue o padrão de `ErroGeracao` — a professora tenta finalizar de novo.

## Backend

### Enum de prompt

`TipoDocumentoIA.RelatorioSecaoReescrita = 5` vira `RelatorioTextoFinal = 5`. O slot é
reaproveitado porque o recurso antigo deixa de existir; uma migration substitui o conteúdo
do `prompt_sistema_ia` desse tipo pelo prompt novo (abaixo). Registros em
`GeracaoIALog` com o valor 5 passam a significar "revisão final" — aceitável, já que o
recurso antigo sai do ar no mesmo deploy.

### Serviço

`RelatorioService.ReescreverSecaoAsync` é substituído por:

```csharp
Task<ServiceResponse<RelatorioBuscarDTO>> SolicitarRevisaoFinalAsync(int id, RelatorioFinalizarDTO dto, Usuario usuario)
Task ProcessarRevisaoFinalAsync(int relatorioId)   // chamado pelo worker
Task<ServiceResponse<RelatorioBuscarDTO>> AceitarRevisaoFinalAsync(int id, Usuario usuario)
Task<ServiceResponse<RelatorioBuscarDTO>> DescartarRevisaoFinalAsync(int id, Usuario usuario)
```

`SolicitarRevisaoFinalAsync` grava `FormatoFinal` e aplica a tabela de decisão do fluxo:
no caminho sem IA chama a lógica de finalização que já existe em `FinalizarAsync`; nos
demais, muda o status para `RevisaoFinal` e enfileira.

`ProcessarRevisaoFinalAsync` monta **uma única chamada** de IA (não uma por seção) e
reusa `IGeradorTextoIA`, `PromptSistemaIAService` e `GeracaoIALogService`, exatamente como
`ReescreverSecaoAsync` fazia.

No modo tópicos, o prompt de usuário lista as seções editadas com um delimitador fixo e a
resposta é lida de volta pelo mesmo delimitador:

```
[[SECAO:4]]
<texto>
[[SECAO:9]]
<texto>
```

Seção que volte ausente ou vazia mantém o texto da professora — a revisão nunca apaga
conteúdo. No modo corrido a resposta é o documento inteiro, sem delimitadores.

### Fila

`IRelatorioGeracaoQueue` hoje enfileira `int` (id do relatório) e o worker sempre chama
`ProcessarGeracaoAsync`. Passa a enfileirar um par `(RelatorioId, TipoProcessamento)` com
`TipoProcessamento` = `Geracao | RevisaoFinal`, e `RelatorioGeracaoWorker` roteia para o
método correspondente. Mantém uma fila só, um worker só.

### Endpoints (`RelatorioController`)

| Método | Rota | Mudança |
|---|---|---|
| POST | `/Relatorio/{id}/secoes/reescrever` | **removido** |
| POST | `/Relatorio/{id}/finalizar` | passa a receber `{ formato }` e a rotear pelo `SolicitarRevisaoFinalAsync` |
| POST | `/Relatorio/{id}/revisao-final/aceitar` | novo |
| POST | `/Relatorio/{id}/revisao-final/descartar` | novo |

`RelatorioSecaoAtualizarDTO` perde `NotasManuais`. `RelatorioSecaoReescreverDTO` e
`RelatorioSecaoReescritaDTO` são apagados. `RelatorioSecaoDTO` troca `NotasManuais` por
`TextoRevisado`. `RelatorioBuscarDTO` ganha `FormatoFinal`, `TextoFinal` e
`TextoFinalGeradoEm`.

## Prompt de sistema (`RelatorioTextoFinal`)

Destilado dos dois materiais enviados pela cliente: *Banco com 250 Frases para Relatórios
do AEE* e *Relatórios do AEE Sem Sofrimento*. O prompt é sobre **como escrever**, nunca
sobre o que dizer — a regra que a própria cliente usa no material é "revise garantindo
clareza, coesão e vocabulário técnico, sem alterar informações".

Estrutura do conteúdo (texto final redigido na implementação):

**Papel e tarefa.** Revisar texto de Relatório Pedagógico do AEE escrito por professora,
melhorando redação e vocabulário. No modo texto corrido, também unir as seções em
narrativa contínua.

**Travas invioláveis.** Não acrescentar informação que não esteja no texto original; não
inferir diagnóstico, hipótese clínica ou causa; não alterar fatos, datas, números,
frequências ou nomes; não remover informação; não inventar exemplo, atividade ou
resultado; manter a extensão aproximada do original.

**Boas práticas.** Frases curtas. Verbos de ação (observou, ampliou, demonstrou,
apresentou). Linguagem neutra e técnica. Foco no comportamento observável. Sem julgamento,
rótulo ou interpretação sem evidência. Nunca transformar observação pontual em
característica permanente do estudante.

**Tríade Ação + Contexto + Impacto.** Descrever o que foi observado, em que situação
ocorreu, qual apoio foi necessário e qual a resposta do estudante.

**Conectores de período.** "No início do período…", "Ao longo das intervenções…",
"Atualmente…", "Ainda apresenta…", "De modo geral…".

**Tabela EVITE → PREFIRA** (16 pares do banco de frases). Exemplos:

| Evite | Prefira |
|---|---|
| "É preguiçoso." | "Em algumas atividades, demonstra pouca iniciativa para iniciar ou concluir as propostas, necessitando de incentivo e mediação." |
| "Não presta atenção." | "Apresenta dificuldade para manter a atenção durante períodos prolongados, necessitando de redirecionamentos em alguns momentos." |
| "Não aprende." | "Ainda necessita de diferentes estratégias, recursos e oportunidades de aprendizagem para desenvolver as habilidades relacionadas a [área]." |
| "Faz birra." | "Diante de determinadas situações de frustração, espera ou mudança, pode apresentar [comportamento observado], necessitando de apoio para reorganizar-se." |
| "Não evoluiu." | "No período observado, ainda não foram identificados avanços consistentes em [habilidade], indicando a necessidade de continuidade e revisão das estratégias utilizadas." |

Os 16 pares completos entram no prompt.

**Situações sensíveis.** Ausências → "a frequência irregular impactou a continuidade das
intervenções". Pouco avanço → "a evolução ocorreu em ritmo próprio, com pequenas
conquistas pontuais". Comportamento → "apresenta episódios de desorganização diante de
tarefas desafiadoras". Apoio familiar limitado → "a devolutiva das atividades enviadas
ocorreu de forma parcial".

**Referência de estilo.** As 14 categorias do banco de frases (evolução, dificuldades,
autonomia, atenção, comunicação, interação, autorregulação, leitura e escrita, cognitivo,
participação, frequência irregular, poucos avanços, intervenções, continuidade) entram
como amostra de fraseado, com instrução explícita de **não copiar frase literal** e de
nunca inserir placeholder do tipo `[habilidade]` no texto revisado.

**Formato de saída.** Modo tópicos: devolver cada seção precedida do delimitador
`[[SECAO:n]]`, sem título, sem comentário, sem markdown. Modo corrido: devolver apenas o
texto do documento.

O prompt é gravado por migration e fica editável pela gestora em Prompts de IA
(`apps/web` → `PromptsIA.tsx`), cujo rótulo passa a ser "Relatório Pedagógico — revisão
final do texto".

## Front (`apps/web-app`)

**Removido de `RelatorioDetailPage.tsx`:** textarea de notas manuais e seu texto de ajuda,
botão "Reescrever com IA", bloco de sugestão da IA, `sugestoesIA`, `descartarSugestao`,
`reescreverSecaoMutation`. `SecaoDraft` fica só com `textoEditado`.

**Removido de `services/relatorioService.ts`:** `reescreverSecaoRelatorio`.
**Removido de `types/relatorio.ts`:** `RelatorioSecaoReescrita`,
`RelatorioSecaoReescritaResponse`, campo `notasManuais`.

**Adicionado:**
- `RelatorioFormatoFinalCodigo` (`0 | 1`) com labels, no padrão dos demais enums de
  `types/relatorio.ts`.
- Diálogo de formato ao clicar em Finalizar, usando o `Dialog` de `components/ui`.
- `RelatorioRevisaoFinal` — componente novo, com o antes/depois e os botões Aceitar e
  Descartar. Fica em arquivo próprio: `RelatorioDetailPage.tsx` já passa de 400 linhas e
  embutir a revisão nela agrava o problema.
- Estado `RevisaoFinal` no `refetchInterval` da query, junto com `Gerando`.

**`lib/relatorioSecoesExport.ts`:** `incorporarNotasManuais` sai. A precedência do corpo de
cada seção passa a ser `TextoRevisado` → `TextoEditado` → `TextoGerado`. Um relatório com
`TextoFinal` (modo corrido) não passa por esse módulo: os exportadores PDF e Word usam o
texto único direto. Relatórios antigos, sem `FormatoFinal`, continuam exportando como hoje.

## Geradores de documento

Nem `exportRelatorioPdf.ts` nem `exportRelatorioDocx.ts` têm bloco próprio de notas
manuais: os dois consomem `montarSecoesRelatorioParaExport`, e a nota é emendada ao fim do
texto da seção dentro desse módulo (`incorporarNotasManuais`). Removendo essa função, os
dois documentos ficam limpos de uma vez — os exportadores em si só mudam para tratar o
modo texto corrido, que não passa por esse módulo.

A geração inicial (`MontarPromptRelatorio`, `RelatorioService.cs`) nunca usou notas
manuais; só a reescrita de seção usava. O prompt de sistema do `RelatorioPedagogico`
também não as menciona — a única migration de prompt que fala em notas manuais é a do
tipo que está sendo substituído (`AddPromptSistemaIARelatorioSecaoReescrita`).

### Inventário de `NotasManuais` (fora de migrations)

| Arquivo | O que fazer |
|---|---|
| `apps/api/Models/RelatorioSecao.cs` | remover propriedade |
| `apps/api/DTOs/Relatorio/RelatorioSecaoDTO.cs` | trocar por `TextoRevisado` |
| `apps/api/DTOs/Relatorio/RelatorioSecaoAtualizarDTO.cs` | remover campo |
| `apps/api/DTOs/Relatorio/RelatorioSecaoReescreverDTO.cs` | apagar arquivo |
| `apps/api/Services/RelatorioService.cs` | remover do mapeamento, da atualização de seção e do prompt de reescrita |
| `apps/web-app/src/types/relatorio.ts` | remover campo e tipos de reescrita |
| `apps/web-app/src/services/relatorioService.ts` | remover do payload e apagar `reescreverSecaoRelatorio` |
| `apps/web-app/src/pages/relatorio/RelatorioDetailPage.tsx` | remover textarea, botão e bloco de sugestão |
| `apps/web-app/src/lib/relatorioSecoesExport.ts` | remover `incorporarNotasManuais` e trocar a precedência |
| `apps/web-app/src/services/relatorioService.test.ts` | ajustar casos |
| `apps/web-app/src/lib/relatorioSecoesExport.test.ts` | ajustar casos |

`apps/mobile` não referencia notas manuais em nenhum ponto.

## Testes

**API:** `SolicitarRevisaoFinalAsync` nos três caminhos da tabela de decisão (tópicos sem
edição não chama IA e finaliza; tópicos com edição enfileira; corrido sempre enfileira);
`ProcessarRevisaoFinalAsync` com resposta bem formada, com seção ausente na resposta
(mantém o texto da professora) e com falha da IA (volta a `Rascunho`); aceitar e descartar.

**Migration:** os três casos da concatenação de `NotasManuais`.

**Front:** `relatorioSecoesExport.test.ts` reescrito para a nova precedência;
`relatorioService.test.ts` sem os casos de reescrita e notas; teste do componente de
revisão (renderiza antes/depois, dispara aceitar e descartar);
`RelatorioDetailPage.test.tsx` cobrindo o diálogo de formato.

## Riscos

**Slot 5 do `TipoDocumentoIA` reaproveitado.** Logs antigos de reescrita passam a ser
lidos como revisão final. Alternativa seria criar `RelatorioTextoFinal = 6` e deixar o 5
órfão; a decisão foi reaproveitar, já que o recurso antigo sai no mesmo deploy.

**Custo e latência do modo corrido.** As 14 seções vão numa chamada só, mesma ordem de
grandeza da geração inicial — por isso passa pela fila, não pela requisição HTTP.

**Drop de `NotasManuais` é irreversível.** A migration de concatenação roda antes do drop,
no mesmo `Up`. Backup do banco antes do deploy é pré-requisito.

**Professora pode não gostar da revisão.** Mitigado pelo Descartar, que devolve o
relatório a `Rascunho` com o texto dela intacto em `TextoEditado`.

## Ordem de implementação sugerida

1. Migration de dados + drop de `NotasManuais`, e remoção do recurso de notas e de
   reescrita (API e front). Entregável fechado, sem IA nova.
2. Campos novos, status `RevisaoFinal`, fila com tipo de processamento.
3. Prompt de sistema e `ProcessarRevisaoFinalAsync`.
4. Diálogo de formato, tela de revisão e exportação.
