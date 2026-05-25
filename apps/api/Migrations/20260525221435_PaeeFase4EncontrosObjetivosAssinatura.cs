using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace api.Migrations
{
    /// <inheritdoc />
    public partial class PaeeFase4EncontrosObjetivosAssinatura : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "assinaturacargo",
                table: "planejamentos",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "assinaturanomeresponsavel",
                table: "planejamentos",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "documentodeclaradoassinado",
                table: "planejamentos",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "objetivocurtoprazo",
                table: "planejamentos",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "objetivolongoprazo",
                table: "planejamentos",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "objetivomedioprazo",
                table: "planejamentos",
                type: "text",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "planejamento_encontros",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    planejamentoid = table.Column<int>(type: "integer", nullable: false),
                    dataenc = table.Column<DateOnly>(type: "date", nullable: false),
                    textoplanejado = table.Column<string>(type: "text", nullable: true),
                    textorealizado = table.Column<string>(type: "text", nullable: true),
                    habilidadeid = table.Column<int>(type: "integer", nullable: true),
                    estrategiaid = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_planejamento_encontros", x => x.id);
                    table.ForeignKey(
                        name: "fk_planejamento_encontros_estrategias_estrategiaid",
                        column: x => x.estrategiaid,
                        principalTable: "estrategias",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_planejamento_encontros_habilidades_habilidadeid",
                        column: x => x.habilidadeid,
                        principalTable: "habilidades",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_planejamento_encontros_planejamentos_planejamentoid",
                        column: x => x.planejamentoid,
                        principalTable: "planejamentos",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ix_planejamento_encontros_estrategiaid",
                table: "planejamento_encontros",
                column: "estrategiaid");

            migrationBuilder.CreateIndex(
                name: "ix_planejamento_encontros_habilidadeid",
                table: "planejamento_encontros",
                column: "habilidadeid");

            migrationBuilder.CreateIndex(
                name: "ix_planejamento_encontros_planejamentoid_dataenc",
                table: "planejamento_encontros",
                columns: new[] { "planejamentoid", "dataenc" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "planejamento_encontros");

            migrationBuilder.DropColumn(
                name: "assinaturacargo",
                table: "planejamentos");

            migrationBuilder.DropColumn(
                name: "assinaturanomeresponsavel",
                table: "planejamentos");

            migrationBuilder.DropColumn(
                name: "documentodeclaradoassinado",
                table: "planejamentos");

            migrationBuilder.DropColumn(
                name: "objetivocurtoprazo",
                table: "planejamentos");

            migrationBuilder.DropColumn(
                name: "objetivolongoprazo",
                table: "planejamentos");

            migrationBuilder.DropColumn(
                name: "objetivomedioprazo",
                table: "planejamentos");
        }
    }
}
