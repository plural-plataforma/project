using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace api.Migrations
{
    /// <inheritdoc />
    public partial class EstudosCasoPaeeFase3 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "estudo_caso_eixos_catalogo",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    codigo = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    rotulo = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: false),
                    descricaohint = table.Column<string>(type: "text", nullable: true),
                    ordemexibicao = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_estudo_caso_eixos_catalogo", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "estudos_caso",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    alunoid = table.Column<int>(type: "integer", nullable: false),
                    professorid = table.Column<int>(type: "integer", nullable: false),
                    titulo = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    contextosituacao = table.Column<string>(type: "text", nullable: true),
                    textosimulado = table.Column<string>(type: "text", nullable: true),
                    createdat = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updatedat = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_estudos_caso", x => x.id);
                    table.ForeignKey(
                        name: "fk_estudos_caso_alunos_alunoid",
                        column: x => x.alunoid,
                        principalTable: "alunos",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_estudos_caso_professores_professorid",
                        column: x => x.professorid,
                        principalTable: "professores",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "estudo_caso_itens_eixo",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    estudodecasoid = table.Column<int>(type: "integer", nullable: false),
                    eixocatalogoid = table.Column<int>(type: "integer", nullable: false),
                    anotacao = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_estudo_caso_itens_eixo", x => x.id);
                    table.ForeignKey(
                        name: "fk_estudo_caso_itens_eixo_estudo_caso_eixos_catalogo_eixocatal~",
                        column: x => x.eixocatalogoid,
                        principalTable: "estudo_caso_eixos_catalogo",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_estudo_caso_itens_eixo_estudos_caso_estudodecasoid",
                        column: x => x.estudodecasoid,
                        principalTable: "estudos_caso",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_estudo_caso_eixos_catalogo_codigo",
                table: "estudo_caso_eixos_catalogo",
                column: "codigo",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_estudo_caso_itens_eixo_eixocatalogoid",
                table: "estudo_caso_itens_eixo",
                column: "eixocatalogoid");

            migrationBuilder.CreateIndex(
                name: "IX_estudo_caso_itens_eixo_estudodecasoid_eixocatalogoid",
                table: "estudo_caso_itens_eixo",
                columns: new[] { "estudodecasoid", "eixocatalogoid" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_estudos_caso_alunoid",
                table: "estudos_caso",
                column: "alunoid");

            migrationBuilder.CreateIndex(
                name: "ix_estudos_caso_professorid",
                table: "estudos_caso",
                column: "professorid");

            migrationBuilder.Sql(
                """
                INSERT INTO estudo_caso_eixos_catalogo (codigo, rotulo, descricaohint, ordemexibicao) VALUES
                ('COMUNICACAO', 'Comunicação e linguagem', 'Compreensão, expressão oral e escrita; uso de AAC quando aplicável.', 1),
                ('COGNICAO', 'Cognição e aprendizagem', 'Atenção, memória, raciocínio e estratégias de estudo.', 2),
                ('SOCIOEMOCIONAL', 'Aspectos socioemocionais', 'Regulação afetiva, interação social e pertencimento.', 3),
                ('AUTONOMIA', 'Autonomia e vida diária', 'Independência funcional, autocuidado e organização.', 4),
                ('FAMILIA_ESCOLA', 'Articulação família-escola-comunidade', 'Participação familiar e alinhamento de metas.', 5),
                ('CURRICULO', 'Currículo e participação', 'Acesso ao currículo com adaptações razoáveis e CMLO.', 6)
                ON CONFLICT (codigo) DO NOTHING;
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "estudo_caso_itens_eixo");

            migrationBuilder.DropTable(
                name: "estudos_caso");

            migrationBuilder.DropTable(
                name: "estudo_caso_eixos_catalogo");
        }
    }
}
