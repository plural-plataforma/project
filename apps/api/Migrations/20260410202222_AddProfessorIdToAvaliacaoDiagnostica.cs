using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace api.Migrations
{
    /// <inheritdoc />
    public partial class AddProfessorIdToAvaliacaoDiagnostica : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "professorid",
                table: "avaliacoes_diagnosticas",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "ix_avaliacoes_diagnosticas_professorid",
                table: "avaliacoes_diagnosticas",
                column: "professorid");

            migrationBuilder.AddForeignKey(
                name: "fk_avaliacoes_diagnosticas_professores_professorid",
                table: "avaliacoes_diagnosticas",
                column: "professorid",
                principalTable: "professores",
                principalColumn: "id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_avaliacoes_diagnosticas_professores_professorid",
                table: "avaliacoes_diagnosticas");

            migrationBuilder.DropIndex(
                name: "ix_avaliacoes_diagnosticas_professorid",
                table: "avaliacoes_diagnosticas");

            migrationBuilder.DropColumn(
                name: "professorid",
                table: "avaliacoes_diagnosticas");
        }
    }
}
