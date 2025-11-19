using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace api.Migrations
{
    /// <inheritdoc />
    public partial class tabelaEstrategias : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "estrategias",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    descricao = table.Column<string>(type: "text", nullable: false),
                    ativo = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_estrategias", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "estrategiasxplanejamento",
                columns: table => new
                {
                    estrategiaid = table.Column<int>(type: "integer", nullable: false),
                    planejamentoid = table.Column<int>(type: "integer", nullable: false),
                    estrategiasid = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_estrategiasxplanejamento", x => new { x.planejamentoid, x.estrategiaid });
                    table.ForeignKey(
                        name: "fk_estrategiasxplanejamento_estrategias_estrategiasid",
                        column: x => x.estrategiasid,
                        principalTable: "estrategias",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "fk_estrategiasxplanejamento_habilidades_estrategiaid",
                        column: x => x.estrategiaid,
                        principalTable: "habilidades",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_estrategiasxplanejamento_planejamentos_planejamentoid",
                        column: x => x.planejamentoid,
                        principalTable: "planejamentos",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_estrategiasxplanejamento_estrategiaid",
                table: "estrategiasxplanejamento",
                column: "estrategiaid");

            migrationBuilder.CreateIndex(
                name: "ix_estrategiasxplanejamento_estrategiasid",
                table: "estrategiasxplanejamento",
                column: "estrategiasid");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "estrategiasxplanejamento");

            migrationBuilder.DropTable(
                name: "estrategias");
        }
    }
}
