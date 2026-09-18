using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace api.Migrations
{
    /// <inheritdoc />
    public partial class RemoveNotasManuaisRelatorioSecao : Migration
    {
        // O scaffold do EF inferiu um RENAME de "notasmanuais" para "textorevisado", por serem
        // as duas colunas de texto que entram e saem da entidade na mesma migration. Seria
        // destrutivo: a nota manual viraria o texto revisado da seção e, como "textorevisado"
        // tem precedência na exportação, sairia no PDF e no Word no lugar do texto da seção.
        // As duas colunas são independentes, então o rename foi substituído por: cria a coluna
        // nova vazia, concatena a nota no texto editado (mesma regra que a exportação aplicava)
        // e só então remove a coluna antiga.
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "textorevisado",
                table: "relatorio_pedagogico_secoes",
                type: "text",
                nullable: true);

            migrationBuilder.Sql(@"
                UPDATE relatorio_pedagogico_secoes
                SET textoeditado = CASE
                    WHEN COALESCE(TRIM(notasmanuais), '') = '' THEN textoeditado
                    WHEN COALESCE(TRIM(textoeditado), '') = '' THEN TRIM(notasmanuais)
                    WHEN TRIM(textoeditado) ~ '[.!?:;]$' THEN TRIM(textoeditado) || ' ' || TRIM(notasmanuais)
                    ELSE TRIM(textoeditado) || '. ' || TRIM(notasmanuais)
                END
                WHERE COALESCE(TRIM(notasmanuais), '') <> '';
            ");

            migrationBuilder.DropColumn(
                name: "notasmanuais",
                table: "relatorio_pedagogico_secoes");

            migrationBuilder.AddColumn<int>(
                name: "formatofinal",
                table: "relatorios_pedagogicos",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "textofinal",
                table: "relatorios_pedagogicos",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "textofinalgeradoem",
                table: "relatorios_pedagogicos",
                type: "timestamp with time zone",
                nullable: true);
        }

        // Reverte o schema, não o conteúdo: "notasmanuais" volta vazia, porque a nota já foi
        // emendada ao texto editado e não é separável de volta.
        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "formatofinal",
                table: "relatorios_pedagogicos");

            migrationBuilder.DropColumn(
                name: "textofinal",
                table: "relatorios_pedagogicos");

            migrationBuilder.DropColumn(
                name: "textofinalgeradoem",
                table: "relatorios_pedagogicos");

            migrationBuilder.AddColumn<string>(
                name: "notasmanuais",
                table: "relatorio_pedagogico_secoes",
                type: "text",
                nullable: true);

            migrationBuilder.DropColumn(
                name: "textorevisado",
                table: "relatorio_pedagogico_secoes");
        }
    }
}
