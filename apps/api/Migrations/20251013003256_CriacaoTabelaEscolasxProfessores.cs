using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace api.Migrations
{
    /// <inheritdoc />
    public partial class CriacaoTabelaEscolasxProfessores : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "escolasxprofessores",
                columns: table => new
                {
                    escolaid = table.Column<int>(type: "integer", nullable: false),
                    professorid = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_escolasxprofessores", x => new { x.escolaid, x.professorid });
                    table.ForeignKey(
                        name: "fk_escolasxprofessores_escolas_escolaid",
                        column: x => x.escolaid,
                        principalTable: "escolas",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_escolasxprofessores_professores_professorid",
                        column: x => x.professorid,
                        principalTable: "professores",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ix_escolasxprofessores_professorid",
                table: "escolasxprofessores",
                column: "professorid");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "escolasxprofessores");
        }
    }
}
