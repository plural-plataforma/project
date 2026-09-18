# Migration pendente: remover `NotasManuais` de `RelatorioSecao` (+ campos da versão final)

> **Este é o documento PRINCIPAL das migrations pendentes desta feature.** Ele descreve a
> primeira (e única) migration de mudança de modelo que sobrou pendente — que sai **combinada**,
> pelo motivo explicado na seção 0 abaixo. O documento
> `2026-09-17-versao-final-relatorio.md` é **complementar**: descreve o significado dos campos
> novos e o passo seguinte (a migration do prompt de sistema, que não mexe em modelo nenhum).
> Rode primeiro o roteiro deste documento; só depois vá para o outro.

**Status: a migration JÁ FOI GERADA e corrigida à mão** — `Migrations/20260918051512_RemoveNotasManuaisRelatorioSecao.cs`.
Ela ainda **não foi aplicada em nenhum banco**. A aplicação acontece sozinha no deploy, porque
`Program.cs` chama `context.Database.Migrate()` no startup da API: subir a branch `staging`
aplica no banco de desenvolvimento; subir `production` aplica no de produção.

## 0. O que o EF gerou de fato — e por que foi corrigido à mão

Todas as mudanças de modelo desta feature — a saída de `NotasManuais` **e** os 4 campos da
versão final (`Relatorio.FormatoFinal`, `Relatorio.TextoFinal`, `Relatorio.TextoFinalGeradoEm`,
`RelatorioSecao.TextoRevisado`) — estavam presentes ao mesmo tempo no código quando a migration
foi gerada. O `dotnet ef migrations add` faz diff do modelo inteiro contra o snapshot, então
tudo saiu num arquivo só. Até aqui, esperado.

**O que não era esperado:** o EF não gerou `DropColumn(notasmanuais)` + `AddColumn(textorevisado)`.
Ele inferiu um **`RenameColumn` de `notasmanuais` para `textorevisado`**, por serem a coluna de
texto que sai e a que entra na mesma entidade, na mesma migration.

Isso seria destrutivo de um jeito silencioso: toda nota manual já gravada viraria o
`TextoRevisado` daquela seção. Como `TextoRevisado` tem precedência na exportação
(`textoRevisado → textoEditado → textoGerado`, ver `relatorioSecoesExport.ts`), o PDF e o Word
passariam a imprimir a nota manual no lugar do texto da seção, sem nenhum erro visível.

Por isso o `Up` da migration foi **reescrito à mão** para a sequência correta:

1. `AddColumn` de `textorevisado` (nova, nula);
2. `UPDATE` concatenando `notasmanuais` em `textoeditado`, com a mesma regra que a exportação
   aplicava antes (nota vazia não altera nada; texto vazio vira a nota; ambos preenchidos
   concatenam, com `.` quando o texto não termina em pontuação);
3. `DropColumn` de `notasmanuais`;
4. os 3 `AddColumn` da tabela `relatorios_pedagogicos`.

O `Down` reverte o schema, não o conteúdo: `notasmanuais` volta vazia, porque a nota já foi
emendada ao texto e não é separável de volta.

**Se esta migration precisar ser regerada do zero algum dia, confira isto primeiro** — o EF vai
propor o rename de novo.

## 1. Backup

Faça backup do banco antes de aplicar — a migration é destrutiva: depois de concatenar o
conteúdo de `notasmanuais` em `textoeditado`, o `DropColumn` apaga a coluna original e esse
conteúdo não é mais recuperável em separado.

## 2. Gerar a migration

A partir da pasta `apps/api`:

```
dotnet ef migrations add RemoveNotasManuaisRelatorioSecao
```

## 3. Convenção de nomes de coluna (conferida no projeto)

O projeto usa Npgsql com nomes de coluna em minúsculo, sem underscore, gerados a partir do nome
da propriedade C# (não é `snake_case` com underscores). Isso foi confirmado em
`apps/api/Migrations/AppDbContextModelSnapshot.cs` e na migration original
`apps/api/Migrations/20260826001632_AddRelatorioPedagogico.cs`:

- Tabela `relatorio_pedagogico_secoes` (nome de tabela é snake_case, mas colunas não):
  coluna do texto editado `textoeditado`, coluna das notas manuais `notasmanuais` (removida),
  coluna nova `textorevisado`.
- Tabela `relatorios_pedagogicos`: colunas novas `formatofinal`, `textofinal`,
  `textofinalgeradoem`.

O SQL da seção 4 já usa essa convenção real — **diferente do que o brief original da task
sugeriu** (`relatorio_secoes` / `texto_editado` / `notas_manuais` em snake_case completo). Ainda
assim, confira contra o arquivo `*_RemoveNotasManuaisRelatorioSecao.cs` gerado pelo
`dotnet ef migrations add` antes de colar — o EF pode ter escolhido nomes diferentes dependendo
da versão/config em uso.

## 4. O que conferir no arquivo gerado

Espere, no mesmo arquivo `*_RemoveNotasManuaisRelatorioSecao.cs`:

- **Um** `DropColumn` — `notasmanuais` em `relatorio_pedagogico_secoes`.
- **Quatro** `AddColumn` — `formatofinal`, `textofinal`, `textofinalgeradoem` em
  `relatorios_pedagogicos`, e `textorevisado` em `relatorio_pedagogico_secoes` (todos
  nullable, nenhum com dado a migrar — ver descrição de cada campo no documento complementar).

Isso é o roteiro real (ver seção 0) — não é motivo pra parar. Só investigue antes de aplicar se
aparecer algo **além** disso: qualquer `DropColumn`/`AlterColumn` envolvendo uma coluna que não
seja `notasmanuais` (`textoeditado`, `textogerado`, `geradoem`, `editadoem`, `status`, etc.), ou
qualquer `CreateTable`/mudança em tabela fora de `relatorios_pedagogicos` e
`relatorio_pedagogico_secoes` — nesses casos sim o modelo divergiu do banco por outro motivo.

## 5. SQL a colar no método `Up`, ANTES do `DropColumn`

```csharp
migrationBuilder.Sql("""
    UPDATE relatorio_pedagogico_secoes
    SET textoeditado = CASE
        WHEN COALESCE(TRIM(notasmanuais), '') = '' THEN textoeditado
        WHEN COALESCE(TRIM(textoeditado), '') = '' THEN TRIM(notasmanuais)
        WHEN TRIM(textoeditado) ~ '[.!?:;]$' THEN TRIM(textoeditado) || ' ' || TRIM(notasmanuais)
        ELSE TRIM(textoeditado) || '. ' || TRIM(notasmanuais)
    END
    WHERE COALESCE(TRIM(notasmanuais), '') <> '';
    """);

migrationBuilder.DropColumn(
    name: "notasmanuais",
    table: "relatorio_pedagogico_secoes");
```

A regra de concatenação replica exatamente a lógica que `relatorioSecoesExport.ts` usava no
front antes da Task 1 remover o recurso: se não há nota, não mexe no texto; se não há texto,
usa só a nota; senão, concatena com espaço se o texto já termina em pontuação, ou com `". "`
caso contrário.

Os quatro `AddColumn` da versão final não precisam de SQL manual — é só adição de coluna, sem
dado prévio pra migrar. Deixe-os como o EF gerou, em qualquer posição do `Up` (não precisam vir
antes nem depois do bloco acima).

## 6. `Down` — aviso obrigatório

O `Down` gerado automaticamente recria a coluna `notasmanuais` vazia (`AddColumn` sem dado) e
desfaz os quatro `AddColumn` novos (`DropColumn` simples — sem necessidade de aviso, essas
colunas não carregam dado que precise de tratamento especial no rollback).

Para `notasmanuais`, **isso precisa ficar registrado como comentário no método `Down` da
migration**, porque o conteúdo concatenado no `Up` não é separável de volta — depois de
aplicado, não há como reconstruir o texto original e a nota manual em separado. Sugestão de
comentário a colar logo acima do `AddColumn` de `notasmanuais` no `Down`:

```csharp
// Down não restaura o conteúdo original: a concatenação feita no Up (textoeditado +
// notasmanuais) não é reversível. Esta coluna volta vazia para todas as linhas.
migrationBuilder.AddColumn<string>(
    name: "notasmanuais",
    table: "relatorio_pedagogico_secoes",
    type: "text",
    nullable: true);
```

## 7. Roteiro de verificação manual (rodar depois de aplicar)

1. Backup do banco antes de aplicar (a migration é destrutiva) — repetido aqui de propósito,
   é o passo mais importante.
2. `dotnet build` na pasta `apps/api` — deve compilar sem erro.
3. `dotnet ef database update` num banco de desenvolvimento **com dado de teste**: crie antes
   uma seção com `TextoEditado = 'Leo avançou'` e `NotasManuais = 'Faltou três vezes.'`, e
   confirme que depois da migration o texto virou `Leo avançou. Faltou três vezes.`.
4. Repita com `TextoEditado` vazio (resultado esperado: só a nota) e com nota vazia (resultado
   esperado: texto intacto).
5. `GET /Relatorio/{id}` de um relatório existente (criado antes da migration) deve trazer
   `formatoFinal: null`, `textoFinal: null` e `textoFinalGeradoEm: null` no relatório, e
   `textoRevisado: null` em cada seção — sem `notasManuais` em lugar nenhum da resposta.
6. `POST /Relatorio/{id}/secoes/reescrever` deve responder 404 (rota removida do controller).

## 8. Próximo passo

Depois de aplicar e verificar esta migration, siga para
`2026-09-17-versao-final-relatorio.md` — a migration vazia do prompt de sistema
(`AddPromptSistemaIARelatorioTextoFinal`) é independente desta e não tem mudança de modelo.
