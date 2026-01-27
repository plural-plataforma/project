using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace api.Migrations
{
    /// <inheritdoc />
    public partial class Add_AvaliacaoDiagnostica_Completa : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "avaliacoes_diagnosticas",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    titulo = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    objetivo = table.Column<string>(type: "text", nullable: true),
                    dataaplicacao = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    escolaid = table.Column<int>(type: "integer", nullable: false),
                    createdat = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updatedat = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    concluida = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_avaliacoes_diagnosticas", x => x.id);
                    table.ForeignKey(
                        name: "fk_avaliacoes_diagnosticas_escolas_escolaid",
                        column: x => x.escolaid,
                        principalTable: "escolas",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "avaliacoes_alunos",
                columns: table => new
                {
                    avaliacaodiagnosticaid = table.Column<int>(type: "integer", nullable: false),
                    alunoid = table.Column<int>(type: "integer", nullable: false),
                    status = table.Column<string>(type: "text", nullable: true),
                    dataconclusaoregistro = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_avaliacoes_alunos", x => new { x.avaliacaodiagnosticaid, x.alunoid });
                    table.ForeignKey(
                        name: "fk_avaliacoes_alunos_alunos_alunoid",
                        column: x => x.alunoid,
                        principalTable: "alunos",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_avaliacoes_alunos_avaliacoes_diagnosticas_avaliacaodiagnost~",
                        column: x => x.avaliacaodiagnosticaid,
                        principalTable: "avaliacoes_diagnosticas",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "avaliacoes_diagnosticas_blocos",
                columns: table => new
                {
                    avaliacaodiagnosticaid = table.Column<int>(type: "integer", nullable: false),
                    blocoid = table.Column<int>(type: "integer", nullable: false),
                    ordemapresentacao = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_avaliacoes_diagnosticas_blocos", x => new { x.avaliacaodiagnosticaid, x.blocoid });
                    table.ForeignKey(
                        name: "fk_avaliacoes_diagnosticas_blocos_avaliacoes_diagnosticas_aval~",
                        column: x => x.avaliacaodiagnosticaid,
                        principalTable: "avaliacoes_diagnosticas",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_avaliacoes_diagnosticas_blocos_bloco_blocoid",
                        column: x => x.blocoid,
                        principalTable: "bloco",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "desempenhos_atividades",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    avaliacaodiagnosticaid = table.Column<int>(type: "integer", nullable: false),
                    atividadeid = table.Column<int>(type: "integer", nullable: false),
                    alunoid = table.Column<int>(type: "integer", nullable: false),
                    nivelrealizacao = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    observacao = table.Column<string>(type: "text", nullable: true),
                    dataregistro = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_desempenhos_atividades", x => x.id);
                    table.ForeignKey(
                        name: "fk_desempenhos_atividades_alunos_alunoid",
                        column: x => x.alunoid,
                        principalTable: "alunos",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_desempenhos_atividades_atividade_atividadeid",
                        column: x => x.atividadeid,
                        principalTable: "atividade",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_desempenhos_atividades_avaliacoes_diagnosticas_avaliacaodia~",
                        column: x => x.avaliacaodiagnosticaid,
                        principalTable: "avaliacoes_diagnosticas",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "diagnosticos_finais",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    avaliacaodiagnosticaid = table.Column<int>(type: "integer", nullable: false),
                    alunoid = table.Column<int>(type: "integer", nullable: false),
                    resumo = table.Column<string>(type: "text", nullable: true),
                    percentualautonomia = table.Column<double>(type: "double precision", nullable: false),
                    recomendacoes = table.Column<string>(type: "text", nullable: true),
                    geradoem = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_diagnosticos_finais", x => x.id);
                    table.ForeignKey(
                        name: "fk_diagnosticos_finais_alunos_alunoid",
                        column: x => x.alunoid,
                        principalTable: "alunos",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_diagnosticos_finais_avaliacoes_diagnosticas_avaliacaodiagno~",
                        column: x => x.avaliacaodiagnosticaid,
                        principalTable: "avaliacoes_diagnosticas",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ix_avaliacoes_alunos_alunoid",
                table: "avaliacoes_alunos",
                column: "alunoid");

            migrationBuilder.CreateIndex(
                name: "ix_avaliacoes_diagnosticas_escolaid",
                table: "avaliacoes_diagnosticas",
                column: "escolaid");

            migrationBuilder.CreateIndex(
                name: "ix_avaliacoes_diagnosticas_blocos_blocoid",
                table: "avaliacoes_diagnosticas_blocos",
                column: "blocoid");

            migrationBuilder.CreateIndex(
                name: "ix_desempenhos_atividades_alunoid",
                table: "desempenhos_atividades",
                column: "alunoid");

            migrationBuilder.CreateIndex(
                name: "ix_desempenhos_atividades_atividadeid",
                table: "desempenhos_atividades",
                column: "atividadeid");

            migrationBuilder.CreateIndex(
                name: "IX_desempenhos_atividades_avaliacaodiagnosticaid_alunoid_ativi~",
                table: "desempenhos_atividades",
                columns: new[] { "avaliacaodiagnosticaid", "alunoid", "atividadeid" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_diagnosticos_finais_alunoid",
                table: "diagnosticos_finais",
                column: "alunoid");

            migrationBuilder.CreateIndex(
                name: "ix_diagnosticos_finais_avaliacaodiagnosticaid",
                table: "diagnosticos_finais",
                column: "avaliacaodiagnosticaid");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "avaliacoes_alunos");

            migrationBuilder.DropTable(
                name: "avaliacoes_diagnosticas_blocos");

            migrationBuilder.DropTable(
                name: "desempenhos_atividades");

            migrationBuilder.DropTable(
                name: "diagnosticos_finais");

            migrationBuilder.DropTable(
                name: "avaliacoes_diagnosticas");
        }
    }
}
