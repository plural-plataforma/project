using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace api.Migrations
{
    /// <inheritdoc />
    public partial class EscolaEntityUpdate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_avaliacoes_diagnosticas_escolas_escolaid",
                table: "avaliacoes_diagnosticas");

            migrationBuilder.AddForeignKey(
                name: "fk_avaliacoes_diagnosticas_escolas_escolaid",
                table: "avaliacoes_diagnosticas",
                column: "escolaid",
                principalTable: "escolas",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_avaliacoes_diagnosticas_escolas_escolaid",
                table: "avaliacoes_diagnosticas");

            migrationBuilder.AddForeignKey(
                name: "fk_avaliacoes_diagnosticas_escolas_escolaid",
                table: "avaliacoes_diagnosticas",
                column: "escolaid",
                principalTable: "escolas",
                principalColumn: "id");
        }
    }
}
