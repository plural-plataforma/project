using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace api.Migrations
{
    /// <inheritdoc />
    public partial class AjusteColunasTabelaPlanejamento : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_planejamentos_professores_professorid",
                table: "planejamentos");

            migrationBuilder.DropIndex(
                name: "ix_planejamentos_professorid",
                table: "planejamentos");

            migrationBuilder.DropColumn(
                name: "professorid",
                table: "planejamentos");

            migrationBuilder.CreateIndex(
                name: "ix_planejamentos_idprofessor",
                table: "planejamentos",
                column: "idprofessor");

            migrationBuilder.AddForeignKey(
                name: "fk_planejamentos_professores_idprofessor",
                table: "planejamentos",
                column: "idprofessor",
                principalTable: "professores",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_planejamentos_professores_idprofessor",
                table: "planejamentos");

            migrationBuilder.DropIndex(
                name: "ix_planejamentos_idprofessor",
                table: "planejamentos");

            migrationBuilder.AddColumn<int>(
                name: "professorid",
                table: "planejamentos",
                type: "integer",
                nullable: false,
                defaultValue: 0);

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
    }
}
