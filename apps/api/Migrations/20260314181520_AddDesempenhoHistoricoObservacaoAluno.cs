using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace api.Migrations
{
    /// <inheritdoc />
    public partial class AddDesempenhoHistoricoObservacaoAluno : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_desempenhos_atividades_avaliacaodiagnosticaid_alunoid_ativi~",
                table: "desempenhos_atividades");

            migrationBuilder.AddColumn<string>(
                name: "observacaogeral",
                table: "avaliacoes_alunos",
                type: "text",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "observacoes_alunos_avaliacao_historico",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    avaliacaodiagnosticaid = table.Column<int>(type: "integer", nullable: false),
                    alunoid = table.Column<int>(type: "integer", nullable: false),
                    observacao = table.Column<string>(type: "text", nullable: true),
                    dataregistro = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_observacoes_alunos_avaliacao_historico", x => x.id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_desempenhos_atividades_avaliacaodiagnosticaid_alunoid_ativi~",
                table: "desempenhos_atividades",
                columns: new[] { "avaliacaodiagnosticaid", "alunoid", "atividadeid" });

            migrationBuilder.CreateIndex(
                name: "IX_desempenhos_atividades_avaliacaodiagnosticaid_dataregistro",
                table: "desempenhos_atividades",
                columns: new[] { "avaliacaodiagnosticaid", "dataregistro" });

            migrationBuilder.CreateIndex(
                name: "IX_observacoes_alunos_avaliacao_historico_avaliacaodiagnostica~",
                table: "observacoes_alunos_avaliacao_historico",
                columns: new[] { "avaliacaodiagnosticaid", "alunoid", "dataregistro" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "observacoes_alunos_avaliacao_historico");

            migrationBuilder.DropIndex(
                name: "IX_desempenhos_atividades_avaliacaodiagnosticaid_alunoid_ativi~",
                table: "desempenhos_atividades");

            migrationBuilder.DropIndex(
                name: "IX_desempenhos_atividades_avaliacaodiagnosticaid_dataregistro",
                table: "desempenhos_atividades");

            migrationBuilder.DropColumn(
                name: "observacaogeral",
                table: "avaliacoes_alunos");

            migrationBuilder.CreateIndex(
                name: "IX_desempenhos_atividades_avaliacaodiagnosticaid_alunoid_ativi~",
                table: "desempenhos_atividades",
                columns: new[] { "avaliacaodiagnosticaid", "alunoid", "atividadeid" },
                unique: true);
        }
    }
}
