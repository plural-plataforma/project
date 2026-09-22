using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace api.Migrations
{
    /// <inheritdoc />
    public partial class AddLimiteUsoIAGeracaoLog : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "bloqueadoporlimite",
                table: "geracao_ia_log",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateIndex(
                name: "ix_geracao_ia_log_professorid_criadoem",
                table: "geracao_ia_log",
                columns: new[] { "professorid", "criadoem" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "ix_geracao_ia_log_professorid_criadoem",
                table: "geracao_ia_log");

            migrationBuilder.DropColumn(
                name: "bloqueadoporlimite",
                table: "geracao_ia_log");
        }
    }
}
