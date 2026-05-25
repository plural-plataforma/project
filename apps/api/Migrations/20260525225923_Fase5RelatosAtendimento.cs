using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace api.Migrations
{
    /// <inheritdoc />
    public partial class Fase5RelatosAtendimento : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "relatos_atendimento",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    alunoid = table.Column<int>(type: "integer", nullable: false),
                    planejamentoid = table.Column<int>(type: "integer", nullable: true),
                    datasessao = table.Column<DateOnly>(type: "date", nullable: false),
                    presencapresente = table.Column<bool>(type: "boolean", nullable: false),
                    tipoocorrencia = table.Column<int>(type: "integer", nullable: false),
                    habilidadeid = table.Column<int>(type: "integer", nullable: true),
                    estrategiaid = table.Column<int>(type: "integer", nullable: true),
                    observacoes = table.Column<string>(type: "text", nullable: true),
                    avancosjson = table.Column<string>(type: "text", nullable: true),
                    dificuldadesjson = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_relatos_atendimento", x => x.id);
                    table.ForeignKey(
                        name: "fk_relatos_atendimento_alunos_alunoid",
                        column: x => x.alunoid,
                        principalTable: "alunos",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_relatos_atendimento_estrategias_estrategiaid",
                        column: x => x.estrategiaid,
                        principalTable: "estrategias",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "fk_relatos_atendimento_habilidades_habilidadeid",
                        column: x => x.habilidadeid,
                        principalTable: "habilidades",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "fk_relatos_atendimento_planejamentos_planejamentoid",
                        column: x => x.planejamentoid,
                        principalTable: "planejamentos",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "ix_relatos_atendimento_alunoid_datasessao",
                table: "relatos_atendimento",
                columns: new[] { "alunoid", "datasessao" });

            migrationBuilder.CreateIndex(
                name: "ix_relatos_atendimento_estrategiaid",
                table: "relatos_atendimento",
                column: "estrategiaid");

            migrationBuilder.CreateIndex(
                name: "ix_relatos_atendimento_habilidadeid",
                table: "relatos_atendimento",
                column: "habilidadeid");

            migrationBuilder.CreateIndex(
                name: "ix_relatos_atendimento_planejamentoid",
                table: "relatos_atendimento",
                column: "planejamentoid");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "relatos_atendimento");
        }
    }
}
