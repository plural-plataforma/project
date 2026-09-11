using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace api.Migrations
{
    /// <inheritdoc />
    public partial class AddTermosDeUso : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "termos",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    chave = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    nome = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_termos", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "termos_versoes",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    termoid = table.Column<int>(type: "integer", nullable: false),
                    versao = table.Column<int>(type: "integer", nullable: false),
                    texto = table.Column<string>(type: "text", nullable: false),
                    publicadoem = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ativo = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_termos_versoes", x => x.id);
                    table.ForeignKey(
                        name: "fk_termos_versoes_termos_termoid",
                        column: x => x.termoid,
                        principalTable: "termos",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "aceites_termos",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    usuarioid = table.Column<string>(type: "text", nullable: false),
                    termoversaoid = table.Column<int>(type: "integer", nullable: false),
                    dataaceite = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ip = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_aceites_termos", x => x.id);
                    table.ForeignKey(
                        name: "fk_aceites_termos_aspnetusers_usuarioid",
                        column: x => x.usuarioid,
                        principalTable: "aspnetusers",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_aceites_termos_termos_versoes_termoversaoid",
                        column: x => x.termoversaoid,
                        principalTable: "termos_versoes",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ix_aceites_termos_termoversaoid",
                table: "aceites_termos",
                column: "termoversaoid");

            migrationBuilder.CreateIndex(
                name: "ix_aceites_termos_usuarioid_termoversaoid",
                table: "aceites_termos",
                columns: new[] { "usuarioid", "termoversaoid" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_termos_chave",
                table: "termos",
                column: "chave",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_termos_versoes_termoid_versao",
                table: "termos_versoes",
                columns: new[] { "termoid", "versao" },
                unique: true);

            migrationBuilder.Sql("""
                INSERT INTO termos (chave, nome)
                SELECT 'uso_ferramenta', 'Termos de Uso da Ferramenta'
                WHERE NOT EXISTS (SELECT 1 FROM termos WHERE chave = 'uso_ferramenta');

                INSERT INTO termos_versoes (termoid, versao, texto, publicadoem, ativo)
                SELECT t.id, 1, $termo$
                <p>Ao utilizar a Plural Plataforma, você concorda com os seguintes termos:</p>
                <ol>
                  <li><strong>Uso da ferramenta</strong>: a Plural Plataforma é destinada ao uso pedagógico por profissionais da educação para apoio ao planejamento, acompanhamento e produção de documentos relacionados ao atendimento educacional de alunos.</li>
                  <li><strong>Dados tratados</strong>: você é responsável pela veracidade e adequação dos dados inseridos na plataforma, incluindo dados de alunos sob sua responsabilidade pedagógica. Evite inserir informações pessoais ou de saúde que não sejam necessárias para a finalidade pedagógica de cada registro. A Plural Plataforma trata os dados conforme a Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018).</li>
                  <li><strong>Inteligência Artificial</strong>: alguns recursos da plataforma utilizam ferramentas de inteligência artificial para apoiar a geração de documentos e sugestões pedagógicas. O conteúdo gerado deve ser revisado por você antes do uso.</li>
                  <li><strong>Conta e acesso</strong>: você é responsável por manter a confidencialidade de sua senha e por todas as atividades realizadas em sua conta.</li>
                  <li><strong>Atualizações destes termos</strong>: novos termos ou versões atualizadas poderão ser publicados conforme a evolução da plataforma. Você será notificada e precisará aceitar as novas versões para continuar utilizando a ferramenta.</li>
                  <li><strong>Direitos da titular</strong>: você pode solicitar informações sobre os dados tratados pela plataforma através do nosso canal de suporte.</li>
                </ol>
                <p>Ao clicar em "Aceitar e continuar", você declara ter lido e concordado com estes termos.</p>
                $termo$, now(), true
                FROM termos t
                WHERE t.chave = 'uso_ferramenta'
                  AND NOT EXISTS (SELECT 1 FROM termos_versoes WHERE termoid = t.id AND versao = 1);
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "aceites_termos");

            migrationBuilder.DropTable(
                name: "termos_versoes");

            migrationBuilder.DropTable(
                name: "termos");
        }
    }
}
