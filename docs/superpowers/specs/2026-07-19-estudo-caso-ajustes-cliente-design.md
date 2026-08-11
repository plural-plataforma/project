# Estudo de Caso — Ajustes solicitados pelo cliente

Data: 2026-07-19
Status: aprovado pelo usuário, aguardando escrita do plano de implementação

## Contexto

Cliente pediu 3 ajustes na tela de detalhe do Estudo de Caso
(`apps/web-app/src/pages/estudo-caso/EstudoCasoDetalheDialog.tsx`):

1. Escolha (um clique) entre formato "como saiu" e formato "texto corrido" nas
   seções **Levantamento das barreiras e potencialidades** e
   **Avaliação pedagógica e funcional**.
2. Renomear botão "Regenerar documento" para "Editar documento".
3. Trocar 3 trechos de texto associados aos eixos do estudo de caso (siglas
   AAC, CMLO, TA por versões por extenso).

Investigação de código confirmou: o texto do estudo de caso **não usa IA
generativa** — é montado por template determinístico em C#
(`EstudoCasoService.MontarTextoSimulado`, `apps/api/Services/EstudoDeCasoService.cs:466-656`).
Os rótulos/descrições dos eixos vêm de seed SQL em migrations EF Core
(tabela `estudo_caso_eixos_catalogo`), não de prompt de IA nem de string fixa
no React.

## Escopo A — Toggle "Padrão / Texto corrido"

**Onde**: seções "2. Levantamento das barreiras e potencialidades" e
"3. Avaliação pedagógica e funcional", renderizadas por
`EstudoCasoDocumentoViewer.tsx` a partir do parse de
`parseEstudoCasoDocumento.ts`.

**Decisão de produto** (confirmada com o usuário):
- Toggle age **depois** do documento já gerado — é só uma troca de exibição,
  sem nova chamada ao backend/regeneração.
- Formato "texto corrido" = conteúdo de cada eixo unido em parágrafo(s)
  corrido(s), sem marcador de bullet (`•`). Não remove negrito de rótulo
  porque hoje não existe negrito nesse ponto (rótulo do eixo já vem embutido
  em texto plano dentro do bullet, ex: `• Comunicação e linguagem: ...`).
- UI: dois botões pequenos tipo aba (`Padrão` | `Texto corrido`) no cabeçalho
  de cada uma dessas duas seções. Clique alterna na hora.
- Estado é local por seção (`useState`), não persiste no banco — reabrir o
  dialog volta ao padrão. É preferência de visualização, não dado do estudo
  de caso.

**Implementação**:
- Nova função `converterSecaoParaTextoCorrido(secao: SecaoEstudoCaso): SecaoEstudoCaso`
  em `apps/web-app/src/lib/parseEstudoCasoDocumento.ts`:
  - Para a seção de Barreiras (que tem subtítulos `subsecao` como
    "Barreiras observadas:" e "Potencialidades identificadas:" seguidos de
    linhas `bullet`): agrupa as linhas `bullet` consecutivas sob cada
    subtítulo em uma única linha `tipo: 'corpo'`, unindo os textos com espaço
    (mantém o texto de cada bullet, sem o caractere `•`). Mantém a linha
    `subsecao` como está.
  - Para a seção de Avaliação (linhas já são `tipo: 'corpo'`, uma por eixo,
    ex: "Em relação a comunicação e linguagem: ..."): agrupa todas as linhas
    `corpo` consecutivas da seção em uma única linha `corpo`, unindo com
    espaço.
  - Função pura, recebe `SecaoEstudoCaso` e devolve nova `SecaoEstudoCaso`
    (não muta original) — permite alternar sem re-parsear o texto bruto.
- Em `EstudoCasoDocumentoViewer.tsx`:
  - Novo estado `const [formatoPorSecao, setFormatoPorSecao] = useState<Record<string, 'padrao' | 'texto'>>({})`.
  - Identificar as duas seções-alvo pelo `secao.titulo` (comparar com os
    títulos exatos gerados pelo backend: `"Levantamento das barreiras e
    potencialidades"` e `"Avaliação pedagógica e funcional"`) — só essas
    exibem o toggle.
  - `SecaoDocumento` recebe a seção já transformada (memoizado por
    `secao.numero` + formato selecionado) quando o formato for `'texto'`.
  - Toggle renderizado no `<h3>` da seção, ao lado do título, com os dois
    botões pequenos.

**Fora de escopo**: não altera o texto gerado pelo backend, não persiste
escolha, não afeta export Word/PDF/Copiar (esses continuam usando o texto
bruto original do backend, formato "como saiu").

## Escopo B — Renomear botão

`apps/web-app/src/pages/estudo-caso/EstudoCasoDetalheDialog.tsx:434`

```tsx
{detalhe.textoSimulado?.trim() ? 'Regenerar documento' : 'Gerar documento'}
```

vira:

```tsx
{detalhe.textoSimulado?.trim() ? 'Editar documento' : 'Gerar documento'}
```

Só o label. `onClick={() => gerarMutation.mutate()}` inalterado — continua
chamando `POST /{id}/gerar-texto-simulado` (regenera pelo template).
Confirmado com usuário: mudança de função não é pedida agora.

## Escopo C — Textos dos eixos (dado de seed, via migration)

Textos vivem em `estudo_caso_eixos_catalogo.descricaohint`, populados por
migrations anteriores (`20260518005435_EstudosCasoPaeeFase3.cs`,
`20260518013812_EstudoCasoCatalogoEixosComplemento.cs`). Não dá pra editar
essas migrations existentes (já rodaram em produção) — precisa de uma
**nova migration** com `UPDATE`.

Nova migration `EstudoCasoCatalogoEixosAjusteTextos` (nome sugerido) em
`apps/api/Migrations/`, seguindo o padrão de `migrationBuilder.Sql(...)` com
`Up`/`Down`:

| codigo | descricaohint atual | descricaohint novo |
|---|---|---|
| `COMUNICACAO` | `Compreensão, expressão oral e escrita; uso de AAC quando aplicável.` | `Compreensão, expressão oral e escrita; uso de comunicação aumentativa e alternativa quando aplicável.` |
| `CURRICULO` | `Acesso ao currículo com adaptações razoáveis e CMLO.` | `Acesso ao currículo por meio de adaptações razoáveis e recursos de acessibilidade.` |
| `ACESSIBILIDADE` | `Física, comunicacional, pedagógica e atitudinal — inclui uso de recursos e TA quando aplicável.` | `Física, comunicacional, pedagógica e atitudinal — inclui uso de recursos e Tecnologia Assistiva quando aplicável.` |

`Up`: `UPDATE estudo_caso_eixos_catalogo SET descricaohint = '<novo>' WHERE codigo = '<codigo>';` para as 3 linhas.
`Down`: mesma coisa revertendo pro texto antigo (guarda os 3 valores antigos
acima para o rollback).

**Efeito**: atualiza a tela de seleção de eixos (Step 3 e dialog de edição,
que leem `eixo.descricaoHint` via API) e o placeholder
`[Completar — referência: {hint}]` usado quando o professor não preenche
anotação naquele eixo. Estudos de caso já gerados com anotação preenchida
pelo professor não usam o hint — não são afetados. Estudos com placeholder
pendente passam a mostrar o hint novo na próxima renderização (o hint não é
persistido no `textoSimulado` salvo até o documento ser gerado/regenerado de
novo).

## Testes

- `apps/web-app/src/lib/parseEstudoCasoDocumento.test.ts`: casos novos para
  `converterSecaoParaTextoCorrido` (bullets agrupados por subsecao viram
  parágrafo único; linhas corpo da seção 3 viram parágrafo único; função não
  muta input).
- Verificação manual via `npm run dev`: abrir um Estudo de Caso com
  documento gerado, clicar no toggle nas duas seções, conferir texto
  corrido correto e reversível; conferir label do botão muda pra "Editar
  documento" quando já existe `textoSimulado`; conferir Step 3 / dialog de
  edição de eixos mostra os 3 hints atualizados.
- Rodar a migration localmente (`dotnet ef database update`) e conferir
  `SELECT descricaohint FROM estudo_caso_eixos_catalogo WHERE codigo IN (...)`.

## Riscos / decisões em aberto

Nenhum — todas as decisões de produto foram confirmadas com o usuário
(toggle pós-geração, formato parágrafo único, botão só renomeia label).
