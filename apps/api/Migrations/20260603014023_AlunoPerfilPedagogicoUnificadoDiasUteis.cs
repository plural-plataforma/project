using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace api.Migrations
{
    /// <inheritdoc />
    public partial class AlunoPerfilPedagogicoUnificadoDiasUteis : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "perfilpedagogico",
                table: "alunos",
                type: "text",
                nullable: true);

            migrationBuilder.Sql("""
                UPDATE alunos
                SET perfilpedagogico = TRIM(BOTH FROM CONCAT_WS(
                    E'\n\n',
                    NULLIF(TRIM(perfilpedagogicopotencialidades), ''),
                    NULLIF(TRIM(perfilpedagogiconecessidades), '')
                ))
                WHERE (perfilpedagogico IS NULL OR TRIM(perfilpedagogico) = '')
                  AND (
                    (perfilpedagogicopotencialidades IS NOT NULL AND TRIM(perfilpedagogicopotencialidades) <> '')
                    OR (perfilpedagogiconecessidades IS NOT NULL AND TRIM(perfilpedagogiconecessidades) <> '')
                  );
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "perfilpedagogico",
                table: "alunos");
        }
    }
}
