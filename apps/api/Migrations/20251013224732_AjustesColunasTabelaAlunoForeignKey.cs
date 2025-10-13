using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace api.Migrations
{
    /// <inheritdoc />
    public partial class AjustesColunasTabelaAlunoForeignKey : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_alunos_escolas_idescola",
                table: "alunos");

            migrationBuilder.DropForeignKey(
                name: "fk_alunos_responsaveis_idresponsavel",
                table: "alunos");

            migrationBuilder.AlterColumn<int>(
                name: "idresponsavel",
                table: "alunos",
                type: "integer",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.AlterColumn<int>(
                name: "idescola",
                table: "alunos",
                type: "integer",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.AddForeignKey(
                name: "fk_alunos_escolas_idescola",
                table: "alunos",
                column: "idescola",
                principalTable: "escolas",
                principalColumn: "id");

            migrationBuilder.AddForeignKey(
                name: "fk_alunos_responsaveis_idresponsavel",
                table: "alunos",
                column: "idresponsavel",
                principalTable: "responsaveis",
                principalColumn: "id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_alunos_escolas_idescola",
                table: "alunos");

            migrationBuilder.DropForeignKey(
                name: "fk_alunos_responsaveis_idresponsavel",
                table: "alunos");

            migrationBuilder.AlterColumn<int>(
                name: "idresponsavel",
                table: "alunos",
                type: "integer",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "integer",
                oldNullable: true);

            migrationBuilder.AlterColumn<int>(
                name: "idescola",
                table: "alunos",
                type: "integer",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "integer",
                oldNullable: true);

            migrationBuilder.AddForeignKey(
                name: "fk_alunos_escolas_idescola",
                table: "alunos",
                column: "idescola",
                principalTable: "escolas",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "fk_alunos_responsaveis_idresponsavel",
                table: "alunos",
                column: "idresponsavel",
                principalTable: "responsaveis",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
