using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace api.Migrations
{
    /// <inheritdoc />
    public partial class TabelasHabilidadesPlanejamento : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_alunos_escolas_idescola",
                table: "alunos");

            migrationBuilder.AlterColumn<int>(
                name: "idescola",
                table: "alunos",
                type: "integer",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "integer",
                oldNullable: true);

            migrationBuilder.CreateTable(
                name: "habilidades",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    nivelensino = table.Column<string>(type: "text", nullable: false),
                    tipo = table.Column<string>(type: "text", nullable: false),
                    descricao = table.Column<string>(type: "text", nullable: false),
                    resumo = table.Column<string>(type: "text", nullable: false),
                    ativo = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_habilidades", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "planejamentos",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    apelido = table.Column<string>(type: "text", nullable: false),
                    datainicio = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    datafim = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_planejamentos", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "alunosxplanejamento",
                columns: table => new
                {
                    alunoid = table.Column<int>(type: "integer", nullable: false),
                    planejamentoid = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_alunosxplanejamento", x => new { x.planejamentoid, x.alunoid });
                    table.ForeignKey(
                        name: "fk_alunosxplanejamento_alunos_alunoid",
                        column: x => x.alunoid,
                        principalTable: "alunos",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_alunosxplanejamento_planejamentos_planejamentoid",
                        column: x => x.planejamentoid,
                        principalTable: "planejamentos",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "habilidadesxplanejamento",
                columns: table => new
                {
                    habilidadeid = table.Column<int>(type: "integer", nullable: false),
                    planejamentoid = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_habilidadesxplanejamento", x => new { x.planejamentoid, x.habilidadeid });
                    table.ForeignKey(
                        name: "fk_habilidadesxplanejamento_habilidades_habilidadeid",
                        column: x => x.habilidadeid,
                        principalTable: "habilidades",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_habilidadesxplanejamento_planejamentos_planejamentoid",
                        column: x => x.planejamentoid,
                        principalTable: "planejamentos",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_alunosxplanejamento_alunoid",
                table: "alunosxplanejamento",
                column: "alunoid");

            migrationBuilder.CreateIndex(
                name: "IX_habilidadesxplanejamento_habilidadeid",
                table: "habilidadesxplanejamento",
                column: "habilidadeid");

            migrationBuilder.AddForeignKey(
                name: "fk_alunos_escolas_idescola",
                table: "alunos",
                column: "idescola",
                principalTable: "escolas",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_alunos_escolas_idescola",
                table: "alunos");

            migrationBuilder.DropTable(
                name: "alunosxplanejamento");

            migrationBuilder.DropTable(
                name: "habilidadesxplanejamento");

            migrationBuilder.DropTable(
                name: "habilidades");

            migrationBuilder.DropTable(
                name: "planejamentos");

            migrationBuilder.AlterColumn<int>(
                name: "idescola",
                table: "alunos",
                type: "integer",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.AddForeignKey(
                name: "fk_alunos_escolas_idescola",
                table: "alunos",
                column: "idescola",
                principalTable: "escolas",
                principalColumn: "id");
        }
    }
}
