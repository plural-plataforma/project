using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace api.Migrations
{
    /// <inheritdoc />
    public partial class PaeeObjetivosCatalogo : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "objetivocurtocatalogoid",
                table: "planejamentos",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "objetivolongocatalogoid",
                table: "planejamentos",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "objetivomediocatalogoid",
                table: "planejamentos",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "paee_objetivos_catalogo",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    codigo = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: false),
                    rotulo = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: false),
                    textomodelo = table.Column<string>(type: "text", nullable: true),
                    prazo = table.Column<int>(type: "integer", nullable: false),
                    ordemexibicao = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_paee_objetivos_catalogo", x => x.id);
                });

            migrationBuilder.CreateIndex(
                name: "ix_planejamentos_objetivocurtocatalogoid",
                table: "planejamentos",
                column: "objetivocurtocatalogoid");

            migrationBuilder.CreateIndex(
                name: "ix_planejamentos_objetivolongocatalogoid",
                table: "planejamentos",
                column: "objetivolongocatalogoid");

            migrationBuilder.CreateIndex(
                name: "ix_planejamentos_objetivomediocatalogoid",
                table: "planejamentos",
                column: "objetivomediocatalogoid");

            migrationBuilder.AddForeignKey(
                name: "fk_planejamentos_paee_objetivos_catalogo_objetivocurtocatalogo~",
                table: "planejamentos",
                column: "objetivocurtocatalogoid",
                principalTable: "paee_objetivos_catalogo",
                principalColumn: "id");

            migrationBuilder.AddForeignKey(
                name: "fk_planejamentos_paee_objetivos_catalogo_objetivolongocatalogo~",
                table: "planejamentos",
                column: "objetivolongocatalogoid",
                principalTable: "paee_objetivos_catalogo",
                principalColumn: "id");

            migrationBuilder.AddForeignKey(
                name: "fk_planejamentos_paee_objetivos_catalogo_objetivomediocatalogo~",
                table: "planejamentos",
                column: "objetivomediocatalogoid",
                principalTable: "paee_objetivos_catalogo",
                principalColumn: "id");

            migrationBuilder.CreateIndex(
                name: "ix_paee_objetivos_catalogo_codigo",
                table: "paee_objetivos_catalogo",
                column: "codigo",
                unique: true);

            migrationBuilder.Sql(
                """
                INSERT INTO paee_objetivos_catalogo (codigo, rotulo, textomodelo, prazo, ordemexibicao) VALUES
                ('CURTO_AUTONOMIA_ROTINAS', 'Autonomia nas rotinas', 'Desenvolver autonomia nas rotinas de autocuidado e organização pessoal, com apoio graduado conforme necessidade do estudante.', 1, 1),
                ('CURTO_COMUNICACAO_FUNCIONAL', 'Comunicação funcional', 'Ampliar a comunicação funcional (verbal, gestual ou alternativa) em contextos escolares significativos.', 1, 2),
                ('CURTO_ATENCAO_ESTRUTURADA', 'Atenção em atividades', 'Consolidar habilidades de atenção sustentada em atividades estruturadas de curta duração.', 1, 3),
                ('CURTO_PARTICIPACAO_GRUPO', 'Participação no grupo', 'Estabelecer vínculo e participação nas interações do grupo, respeitando o ritmo individual.', 1, 4),
                ('MEDIO_GENERALIZACAO_SOCIAL', 'Generalização social', 'Generalizar habilidades sociais (turno, cooperação, resolução de conflitos) em diferentes contextos escolares.', 2, 1),
                ('MEDIO_LEITURA_ESCRITA_FUNCIONAL', 'Leitura e escrita funcional', 'Ampliar repertório de leitura e escrita funcional alinhado às demandas curriculares da etapa.', 2, 2),
                ('MEDIO_AUTORREGULACAO', 'Autorregulação emocional', 'Desenvolver estratégias de autorregulação emocional e comportamental com mediação pedagógica.', 2, 3),
                ('MEDIO_PARTICIPACAO_CURRICULAR', 'Participação curricular', 'Participar ativamente das atividades curriculares com apoio graduado e recursos de acessibilidade.', 2, 4),
                ('LONGO_AUTONOMIA_ESCOLAR', 'Autonomia escolar', 'Promover autonomia e participação plena na vida escolar, com progressiva redução de apoios.', 3, 1),
                ('LONGO_TRANSICAO_ETAPAS', 'Transição entre etapas', 'Consolidar habilidades necessárias à transição entre etapas de ensino e continuidade pedagógica.', 3, 2),
                ('LONGO_PROJETO_VIDA', 'Projeto de vida', 'Desenvolver projeto de vida alinhado às potencialidades, interesses e necessidades do estudante.', 3, 3),
                ('LONGO_INDEPENDENCIA_ACADEMICA', 'Independência acadêmica', 'Ampliar independência nas atividades acadêmicas e sociais, com monitoramento contínuo.', 3, 4)
                ON CONFLICT (codigo) DO NOTHING;
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_planejamentos_paee_objetivos_catalogo_objetivocurtocatalogo~",
                table: "planejamentos");

            migrationBuilder.DropForeignKey(
                name: "fk_planejamentos_paee_objetivos_catalogo_objetivolongocatalogo~",
                table: "planejamentos");

            migrationBuilder.DropForeignKey(
                name: "fk_planejamentos_paee_objetivos_catalogo_objetivomediocatalogo~",
                table: "planejamentos");

            migrationBuilder.DropTable(
                name: "paee_objetivos_catalogo");

            migrationBuilder.DropIndex(
                name: "ix_planejamentos_objetivocurtocatalogoid",
                table: "planejamentos");

            migrationBuilder.DropIndex(
                name: "ix_planejamentos_objetivolongocatalogoid",
                table: "planejamentos");

            migrationBuilder.DropIndex(
                name: "ix_planejamentos_objetivomediocatalogoid",
                table: "planejamentos");

            migrationBuilder.DropColumn(
                name: "objetivocurtocatalogoid",
                table: "planejamentos");

            migrationBuilder.DropColumn(
                name: "objetivolongocatalogoid",
                table: "planejamentos");

            migrationBuilder.DropColumn(
                name: "objetivomediocatalogoid",
                table: "planejamentos");
        }
    }
}
