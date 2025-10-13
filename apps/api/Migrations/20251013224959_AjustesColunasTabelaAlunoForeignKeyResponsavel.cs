using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace api.Migrations
{
    /// <inheritdoc />
    public partial class AjustesColunasTabelaAlunoForeignKeyResponsavel : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_alunos_responsaveis_idresponsavel",
                table: "alunos");

            migrationBuilder.DropIndex(
                name: "ix_alunos_idresponsavel",
                table: "alunos");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "ix_alunos_idresponsavel",
                table: "alunos",
                column: "idresponsavel");

            migrationBuilder.AddForeignKey(
                name: "fk_alunos_responsaveis_idresponsavel",
                table: "alunos",
                column: "idresponsavel",
                principalTable: "responsaveis",
                principalColumn: "id");
        }
    }
}
