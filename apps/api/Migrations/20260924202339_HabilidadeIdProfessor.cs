using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace api.Migrations
{
    /// <inheritdoc />
    public partial class HabilidadeIdProfessor : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "idprofessor",
                table: "habilidades",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "ix_habilidades_idprofessor",
                table: "habilidades",
                column: "idprofessor");

            migrationBuilder.AddForeignKey(
                name: "fk_habilidades_professores_idprofessor",
                table: "habilidades",
                column: "idprofessor",
                principalTable: "professores",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_habilidades_professores_idprofessor",
                table: "habilidades");

            migrationBuilder.DropIndex(
                name: "ix_habilidades_idprofessor",
                table: "habilidades");

            migrationBuilder.DropColumn(
                name: "idprofessor",
                table: "habilidades");
        }
    }
}
