using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace api.Migrations
{
    /// <inheritdoc />
    public partial class EscolaIdOpcional : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_avaliacoes_diagnosticas_escolas_escolaid",
                table: "avaliacoes_diagnosticas");

            migrationBuilder.AlterColumn<int>(
                name: "escolaid",
                table: "avaliacoes_diagnosticas",
                type: "integer",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.AddForeignKey(
                name: "fk_avaliacoes_diagnosticas_escolas_escolaid",
                table: "avaliacoes_diagnosticas",
                column: "escolaid",
                principalTable: "escolas",
                principalColumn: "id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_avaliacoes_diagnosticas_escolas_escolaid",
                table: "avaliacoes_diagnosticas");

            migrationBuilder.AlterColumn<int>(
                name: "escolaid",
                table: "avaliacoes_diagnosticas",
                type: "integer",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "integer",
                oldNullable: true);

            migrationBuilder.AddForeignKey(
                name: "fk_avaliacoes_diagnosticas_escolas_escolaid",
                table: "avaliacoes_diagnosticas",
                column: "escolaid",
                principalTable: "escolas",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
