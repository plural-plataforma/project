using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace api.Migrations
{
    /// <inheritdoc />
    public partial class Fase2DiagnosticoHabilidadesFinal : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "habilidadesareenforcar",
                table: "diagnosticos_finais",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "habilidadesfortes",
                table: "diagnosticos_finais",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "habilidadesareenforcar",
                table: "diagnosticos_finais");

            migrationBuilder.DropColumn(
                name: "habilidadesfortes",
                table: "diagnosticos_finais");
        }
    }
}
