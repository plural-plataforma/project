using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace api.Migrations
{
    /// <inheritdoc />
    public partial class AjustesTabelasHabilidadesPlanejamentos : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "idprofessor",
                table: "planejamentos",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "professorid",
                table: "planejamentos",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AlterColumn<string>(
                name: "resumo",
                table: "habilidades",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.CreateIndex(
                name: "ix_planejamentos_professorid",
                table: "planejamentos",
                column: "professorid");

            migrationBuilder.AddForeignKey(
                name: "fk_planejamentos_professores_professorid",
                table: "planejamentos",
                column: "professorid",
                principalTable: "professores",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_planejamentos_professores_professorid",
                table: "planejamentos");

            migrationBuilder.DropIndex(
                name: "ix_planejamentos_professorid",
                table: "planejamentos");

            migrationBuilder.DropColumn(
                name: "idprofessor",
                table: "planejamentos");

            migrationBuilder.DropColumn(
                name: "professorid",
                table: "planejamentos");

            migrationBuilder.AlterColumn<string>(
                name: "resumo",
                table: "habilidades",
                type: "text",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);
        }
    }
}
