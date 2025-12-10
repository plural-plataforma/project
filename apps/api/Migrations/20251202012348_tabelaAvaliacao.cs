using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace api.Migrations
{
    /// <inheritdoc />
    public partial class tabelaAvaliacao : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "avaliacao",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    descricao = table.Column<string>(type: "text", nullable: true),
                    resumo = table.Column<string>(type: "text", nullable: true),
                    ativo = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_avaliacao", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "avaliacaoxplanejamento",
                columns: table => new
                {
                    avaliacaoid = table.Column<int>(type: "integer", nullable: false),
                    planejamentoid = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_avaliacaoxplanejamento", x => new { x.planejamentoid, x.avaliacaoid });
                    table.ForeignKey(
                        name: "fk_avaliacaoxplanejamento_avaliacao_avaliacaoid",
                        column: x => x.avaliacaoid,
                        principalTable: "avaliacao",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_avaliacaoxplanejamento_planejamentos_planejamentoid",
                        column: x => x.planejamentoid,
                        principalTable: "planejamentos",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_avaliacaoxplanejamento_avaliacaoid",
                table: "avaliacaoxplanejamento",
                column: "avaliacaoid");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "avaliacaoxplanejamento");

            migrationBuilder.DropTable(
                name: "avaliacao");
        }
    }
}
