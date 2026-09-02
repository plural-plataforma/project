using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace api.Migrations
{
    /// <inheritdoc />
    public partial class AddRelatorioPedagogico : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "relatorios_pedagogicos",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    alunoid = table.Column<int>(type: "integer", nullable: false),
                    professorid = table.Column<int>(type: "integer", nullable: false),
                    escolaid = table.Column<int>(type: "integer", nullable: true),
                    datainicio = table.Column<DateOnly>(type: "date", nullable: false),
                    datafim = table.Column<DateOnly>(type: "date", nullable: false),
                    tipoperiodo = table.Column<int>(type: "integer", nullable: false),
                    status = table.Column<int>(type: "integer", nullable: false),
                    createdat = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updatedat = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_relatorios_pedagogicos", x => x.id);
                    table.ForeignKey(
                        name: "fk_relatorios_pedagogicos_alunos_alunoid",
                        column: x => x.alunoid,
                        principalTable: "alunos",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_relatorios_pedagogicos_escolas_escolaid",
                        column: x => x.escolaid,
                        principalTable: "escolas",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_relatorios_pedagogicos_professores_professorid",
                        column: x => x.professorid,
                        principalTable: "professores",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "relatorio_pedagogico_secoes",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    relatorioid = table.Column<int>(type: "integer", nullable: false),
                    secaochave = table.Column<int>(type: "integer", nullable: false),
                    textogerado = table.Column<string>(type: "text", nullable: true),
                    textoeditado = table.Column<string>(type: "text", nullable: true),
                    notasmanuais = table.Column<string>(type: "text", nullable: true),
                    geradoem = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    editadoem = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_relatorio_pedagogico_secoes", x => x.id);
                    table.ForeignKey(
                        name: "fk_relatorio_pedagogico_secoes_relatorios_pedagogicos_relatori~",
                        column: x => x.relatorioid,
                        principalTable: "relatorios_pedagogicos",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ix_relatorio_pedagogico_secoes_relatorioid_secaochave",
                table: "relatorio_pedagogico_secoes",
                columns: new[] { "relatorioid", "secaochave" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_relatorios_pedagogicos_alunoid_periodo",
                table: "relatorios_pedagogicos",
                columns: new[] { "alunoid", "datainicio", "datafim" });

            migrationBuilder.CreateIndex(
                name: "ix_relatorios_pedagogicos_escolaid",
                table: "relatorios_pedagogicos",
                column: "escolaid");

            migrationBuilder.CreateIndex(
                name: "ix_relatorios_pedagogicos_professorid",
                table: "relatorios_pedagogicos",
                column: "professorid");

            migrationBuilder.InsertData(
                table: "prompt_sistema_ia",
                columns: new[] { "tipodocumento", "conteudo", "createdat", "updatedat" },
                values: new object[]
                {
                    4, // TipoDocumentoIA.RelatorioPedagogico
                    "Prompt ainda não definido — documento fora do escopo desta fase (ver spec de geração de documentos via IA).",
                    new DateTime(2026, 8, 25, 0, 0, 0, DateTimeKind.Utc),
                    new DateTime(2026, 8, 25, 0, 0, 0, DateTimeKind.Utc)
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "prompt_sistema_ia",
                keyColumn: "tipodocumento",
                keyValue: 4);

            migrationBuilder.DropTable(
                name: "relatorio_pedagogico_secoes");

            migrationBuilder.DropTable(
                name: "relatorios_pedagogicos");
        }
    }
}
