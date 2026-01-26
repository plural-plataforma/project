using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace api.Migrations
{
    /// <inheritdoc />
    public partial class AddAtividade : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "atividade",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    titulo = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    enunciado = table.Column<string>(type: "text", nullable: true),
                    blocoid = table.Column<int>(type: "integer", nullable: false),
                    nivel = table.Column<string>(type: "text", nullable: false),
                    etapamin = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    etapamax = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    imagemurl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    ativo = table.Column<bool>(type: "boolean", nullable: false),
                    createdat = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updatedat = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_atividade", x => x.id);
                    table.ForeignKey(
                        name: "fk_atividade_bloco_blocoid",
                        column: x => x.blocoid,
                        principalTable: "bloco",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "AtividadeHabilidade",
                columns: table => new
                {
                    AtividadeId = table.Column<int>(type: "integer", nullable: false),
                    HabilidadeId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AtividadeHabilidade", x => new { x.AtividadeId, x.HabilidadeId });
                    table.ForeignKey(
                        name: "fk_atividadehabilidade_atividade_atividadesid",
                        column: x => x.AtividadeId,
                        principalTable: "atividade",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_atividadehabilidade_habilidades_habilidadesid",
                        column: x => x.HabilidadeId,
                        principalTable: "habilidades",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ix_atividade_blocoid",
                table: "atividade",
                column: "blocoid");

            migrationBuilder.CreateIndex(
                name: "IX_AtividadeHabilidade_HabilidadeId",
                table: "AtividadeHabilidade",
                column: "HabilidadeId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AtividadeHabilidade");

            migrationBuilder.DropTable(
                name: "atividade");
        }
    }
}
