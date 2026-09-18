# Migration pendente: campos de versão final do Relatório Pedagógico

> **Este documento é COMPLEMENTAR.** O documento PRINCIPAL é
> `2026-09-17-remove-notas-manuais.md`: como o `DropColumn` de `NotasManuais` e os 4
> `AddColumn` descritos abaixo já estão pendentes ao mesmo tempo no modelo C#, o primeiro
> `dotnet ef migrations add` que rodar — que é o dessa migration, pela ordem do roteiro —
> captura os dois de uma vez, no mesmo arquivo `*_RemoveNotasManuaisRelatorioSecao.cs`. **Não
> rode `dotnet ef migrations add AddVersaoFinalRelatorio`** depois dela: não sobra nenhuma
> mudança de modelo pendente pra essa migration capturar, ela sairia vazia. Siga o roteiro do
> documento principal pra gerar e aplicar o schema; este documento aqui só descreve o
> significado de cada campo novo (seção 1) e, mais abaixo, a migration separada do prompt de
> sistema (Task 5, que não mexe em modelo nenhum e por isso não tem esse problema).

Esta seção não foi gerada nem aplicada nesta sessão (ambiente sem `dotnet` autorizado).

## 1. O que muda

Só adiciona colunas — nenhuma coluna existente é alterada por causa deste conjunto de campos
(a remoção de `NotasManuais` é tratada no documento principal). Sem risco de perda de dado
nesta parte, mas ainda assim recomenda-se backup antes de aplicar em produção, como de praxe
(o documento principal já cobre isso, por causa do `DropColumn` que vem junto).

Campos novos (Task 3 do plano `2026-09-17-relatorio-versao-final`):

- `Relatorio.FormatoFinal` (`RelatorioFormatoFinal?`) — formato escolhido pela professora ao
  finalizar (`Topicos = 0`, `TextoCorrido = 1`).
- `Relatorio.TextoFinal` (`string?`, `text`) — texto final consolidado, quando gerado.
- `Relatorio.TextoFinalGeradoEm` (`DateTime?`) — quando a IA terminou de gerar o texto final;
  distingue, junto com `Status.RevisaoFinal`, se a revisão ainda está rodando na fila (`null`)
  ou já terminou e está aguardando decisão da professora (preenchido).
- `RelatorioSecao.TextoRevisado` (`string?`, `text`) — texto da seção revisado pela IA a partir
  de `TextoEditado`, preenchido só para seções que a professora editou.

## 2. Gerar a migration — não faça isso separadamente

Estes 4 campos **não geram uma migration própria**. Siga `2026-09-17-remove-notas-manuais.md`
(documento principal) — a migration `RemoveNotasManuaisRelatorioSecao` gerada por ele já traz
os 4 `AddColumn` abaixo combinados com o `DropColumn` de `NotasManuais`.

## 3. Convenção de nomes de coluna (conferida no projeto)

Confirmado em `apps/api/Migrations/AppDbContextModelSnapshot.cs`: o projeto usa Npgsql com
nomes de coluna em minúsculo, sem underscore, gerados a partir do nome da propriedade C#
(mesma convenção documentada em `docs/migrations-pendentes/2026-09-17-remove-notas-manuais.md`).
Nomes de coluna esperados para os campos novos:

- Tabela `relatorios_pedagogicos`: `formatofinal`, `textofinal`, `textofinalgeradoem`.
- Tabela `relatorio_pedagogico_secoes`: `textorevisado`.

Confira contra o arquivo `*_RemoveNotasManuaisRelatorioSecao.cs` gerado pelo
`dotnet ef migrations add` (rodado a partir do documento principal) antes de aplicar — o EF
pode escolher nomes diferentes dependendo da versão/config em uso.

## 4. Conferir o arquivo gerado

Ver seção 4 do documento principal — a checagem desses 4 `AddColumn` é feita junto com a do
`DropColumn` de `NotasManuais`, no mesmo arquivo de migration. Não é necessário colar nenhum
SQL manual pra estes campos: é só adição de coluna, sem dado prévio para migrar (diferente do
`DropColumn` de `NotasManuais`, que precisa concatenar dado existente antes de apagar a coluna).

## 5. Roteiro de verificação manual

Coberto pelo roteiro de verificação do documento principal (seção 7) — ele já confere
`formatoFinal`, `textoFinal`, `textoFinalGeradoEm` e `textoRevisado` no `GET /Relatorio/{id}`
junto com a checagem da remoção de `notasManuais`.

---

# Migration pendente: prompt de sistema da revisão final do texto (Task 5)

Passo 2 do roteiro geral — rode só depois de aplicar e verificar a migration do documento
principal (`2026-09-17-remove-notas-manuais.md`). Esta migration é independente: não muda
nenhuma entidade C#, só o conteúdo de uma linha já existente em `prompt_sistema_ia`.

Esta migration não foi gerada nem aplicada nesta sessão (ambiente sem `dotnet` autorizado).
O usuário deve rodar os passos abaixo manualmente.

## 1. O que muda

O tipo de documento 5 (`TipoDocumentoIA`) deixou de ser "reescrever seção com IA" (recurso já
removido em tasks anteriores) e passou a ser `RelatorioTextoFinal` — a revisão final do texto
que a professora editou no Relatório Pedagógico. A linha do tipo 5 já existe em
`prompt_sistema_ia` (inserida pela migration `AddPromptSistemaIARelatorioSecaoReescrita`); esta
migration **substitui o conteúdo** dessa linha pelo novo prompt, via `UPDATE` — não `INSERT`,
porque a linha já existe.

## 2. Gerar a migration

A partir da pasta `apps/api`:

```
dotnet ef migrations add AddPromptSistemaIARelatorioTextoFinal
```

Como não há nenhuma mudança de modelo (nenhuma entidade C# muda), o EF deve gerar uma migration
vazia (`Up`/`Down` sem nenhuma chamada). É nela que o SQL abaixo precisa ser colado à mão.

## 3. Convenção de nomes de coluna (conferida no projeto)

Confirmado em `apps/api/Migrations/AppDbContextModelSnapshot.cs`, entidade
`api.Models.PromptSistemaIA`: mesma convenção das demais tabelas — nomes de coluna em minúsculo,
sem underscore. Colunas relevantes da tabela `prompt_sistema_ia`:

- `tipodocumento` (integer) — chave usada no `WHERE`.
- `conteudo` (text) — texto do prompt.
- `updatedat` (timestamp with time zone).

Essa é a mesma convenção já usada em
`apps/api/Migrations/20260911120000_AddPromptSistemaIARelatorioSecaoReescrita.cs`, a migration
de referência para esta task.

## 4. SQL a colar no método `Up`

Segue o padrão de dollar-quoting Postgres já usado em
`apps/api/Migrations/20260909001119_AddTermosDeUso.cs` (evita qualquer escape de aspas simples
ou duplas dentro do texto do prompt):

```csharp
migrationBuilder.Sql("""
    UPDATE prompt_sistema_ia
    SET conteudo = $prompt$
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
    $prompt$,
    updatedat = now()
    WHERE tipodocumento = 5;
    """);
```

Atenção ao indentar exatamente como o EF gerar (a indentação do raw string `"""` é sensível —
copie o bloco acima mantendo o recuo relativo entre as linhas, ou ajuste conforme o arquivo
gerado).

## 5. SQL a colar no método `Down` — restaura o prompt antigo de reescrita

O `Down` deve devolver o conteúdo antigo (o prompt de "reescrever seção com IA", copiado de
`AddPromptSistemaIARelatorioSecaoReescrita.cs`), não apagar a linha — o tipo 5 já existia antes
desta migration.

```csharp
migrationBuilder.Sql("""
    UPDATE prompt_sistema_ia
    SET conteudo = $prompt$
    Você é um assistente pedagógico especializado em Atendimento Educacional Especializado (AEE), seguindo o Caderno Pedagógico "AEE: Concepções e Metodologias" (MEC/UFC). Sua tarefa é reescrever UMA seção do Relatório Pedagógico de um estudante, incorporando ao texto as notas manuais escritas pela professora.

    O prompt do usuário traz a seção, o texto atual dela e as notas manuais da professora. As notas são observações soltas, em linguagem informal, que a professora quer ver refletidas no relatório — elas são informação de primeira mão sobre o estudante e devem ser tratadas como fato.

    REGRAS OBRIGATÓRIAS:
    1. Incorpore o conteúdo das notas manuais ao corpo do texto, na posição em que fizer sentido pedagógico. O resultado é um texto único e corrido — nunca deixe a nota como frase solta no fim, nunca a rotule como "nota", "observação da professora" ou equivalente.
    2. Preserve o que o texto atual já afirma. Você reescreve para acomodar a nota, não para trocar o conteúdo existente por outro. Se a nota contradisser o texto atual, prevalece a nota — é a professora corrigindo o que a IA escreveu.
    3. Não invente nada além do que está no texto atual e nas notas. Sem diagnósticos, causas clínicas, avanços, dificuldades ou episódios que não tenham sido informados.
    4. Modelo social da deficiência: nunca defina o estudante pelo diagnóstico biomédico ou por rótulos de incapacidade. O foco é nas barreiras que impedem participação e no desenvolvimento de autonomia.
    5. Ao descrever barreiras, use exclusivamente estas 5 categorias, sem inventar outras: comunicacional, atitudinal, física/arquitetônica, social, tecnológica.
    6. Vocabulário proibido: "reforço escolar", "laudo obrigatório", ou qualquer termo capacitista que presuma incompetência do estudante.
    7. Diferencie observação de interpretação: registre o que foi observado, não conclusões sobre motivo, intenção ou estado emocional do estudante. Evite julgamentos de valor sobre o estudante ou sua família.
    8. Eleve o registro da nota ao tom do relatório. A nota chega informal ("faltou algumas vezes, pois mora longe") e sai em linguagem pedagógica formal, sem perder o fato que ela carrega.
    9. Mantenha a extensão próxima à do texto atual — a reescrita acomoda a nota, não infla a seção. Se o texto atual estiver vazio, redija a seção a partir apenas das notas, em um ou dois parágrafos curtos.

    FORMATO DE SAÍDA (regra crítica): responda apenas com o texto final da seção, em texto corrido, português do Brasil. Nunca em JSON, nunca em markdown, sem bullet points, sem subtítulos, sem repetir o título da seção, sem comentário algum antes ou depois do texto.

    ANTI-REPETIÇÃO: não use fórmulas de conexão fixas (evite "é importante ressaltar", "nesse sentido", "cabe destacar"). Varie a redação a cada reescrita.

    TOM: pedagógico, formal mas natural, em texto corrido.
    $prompt$,
    updatedat = now()
    WHERE tipodocumento = 5;
    """);
```

## 6. O que conferir no arquivo gerado pelo EF

- A migration gerada deve vir **vazia** (sem `AddColumn`/`CreateTable`/etc.) — o único motivo de
  existir é carregar o SQL manual acima. Se o EF detectar qualquer diff de modelo além disso,
  pare e investigue antes de colar o SQL.
- Confirme que o nome da classe/arquivo bate com `AddPromptSistemaIARelatorioTextoFinal`.
- Cole o SQL da seção 4 dentro de `Up`, e o da seção 5 dentro de `Down`, substituindo os corpos
  vazios que o EF gerou.
- Rode `grep -c '\$prompt\$'` no arquivo final: deve dar exatamente 2 por bloco SQL (par de
  abre/fecha do dollar-quoting) — 4 no total no arquivo.

## 7. Roteiro de verificação manual (rodar depois de aplicar)

1. `dotnet build` na pasta `apps/api` — deve compilar sem erro.
2. `dotnet ef database update` num banco de desenvolvimento.
3. Abrir "Prompts de IA" em `apps/web` com usuária gestora: o prompt do tipo
   `RelatorioTextoFinal` aparece com o rótulo "Relatório Pedagógico — revisão final do texto",
   já com o novo conteúdo (não mais o prompt de reescrita), e é editável e salvável.
