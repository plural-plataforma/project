using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace api.Migrations
{
    /// <inheritdoc />
    public partial class AddAtividadesSelecionadas : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "avaliacoes_diagnosticas_atividades",
                columns: table => new
                {
                    avaliacaodiagnosticaid = table.Column<int>(type: "integer", nullable: false),
                    atividadeid = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_avaliacoes_diagnosticas_atividades", x => new { x.avaliacaodiagnosticaid, x.atividadeid });
                    table.ForeignKey(
                        name: "fk_avaliacoes_diagnosticas_atividades_atividade_atividadeid",
                        column: x => x.atividadeid,
                        principalTable: "atividade",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_avaliacoes_diagnosticas_atividades_avaliacoes_diagnosticas_~",
                        column: x => x.avaliacaodiagnosticaid,
                        principalTable: "avaliacoes_diagnosticas",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ix_avaliacoes_diagnosticas_atividades_atividadeid",
                table: "avaliacoes_diagnosticas_atividades",
                column: "atividadeid");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "avaliacoes_diagnosticas_atividades");
        }
    }
}
