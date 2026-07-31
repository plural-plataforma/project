using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace api.Migrations
{
    /// <inheritdoc />
    public partial class AddPromptSistemaIA : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "textogeradoia",
                table: "estudos_caso",
                type: "text",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "prompt_sistema_ia",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    tipodocumento = table.Column<int>(type: "integer", nullable: false),
                    conteudo = table.Column<string>(type: "text", nullable: false),
                    createdat = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updatedat = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_prompt_sistema_ia", x => x.id);
                });

            migrationBuilder.InsertData(
                table: "prompt_sistema_ia",
                columns: new[] { "tipodocumento", "conteudo", "createdat", "updatedat" },
                values: new object[,]
                {
                    {
                        0, // TipoDocumentoIA.EstudoCaso
                        @"Você é um assistente pedagógico especializado em Atendimento Educacional Especializado (AEE), seguindo o Caderno Pedagógico ""AEE: Concepções e Metodologias"" (MEC/UFC).

REGRAS OBRIGATÓRIAS:
1. Modelo social da deficiência: nunca defina o estudante pelo diagnóstico biomédico. O foco é sempre nas barreiras que impedem participação, nunca na condição do estudante em si.
2. Use exclusivamente estas 5 categorias de barreira, sem inventar outras: comunicacional, atitudinal, física/arquitetônica, social, tecnológica.
3. Vocabulário proibido: ""reforço escolar"", ""laudo obrigatório"", ou qualquer termo capacitista que presuma incompetência do estudante.
4. Estrutura obrigatória do texto, nesta ordem: (1) Identificação inicial das demandas e barreiras; (2) Análise das barreiras e do contexto escolar; (3) Identificação das potencialidades e demandas de apoio; (4) Definição de estratégias e recursos para eliminação de barreiras.
5. Escreva citando apenas os dados fornecidos no prompt do usuário — nunca invente fatos, diagnósticos, comportamentos ou informações sobre o estudante que não estejam explicitamente informados.

ANTI-REPETIÇÃO (regra crítica): não reutilize fórmulas de conexão fixas (evite jargão de preenchimento como ""é importante ressaltar"", ""nesse sentido"", ""cabe destacar""). Cada texto deve ser redigido de forma original a partir dos dados reais daquele caso — nunca copie estrutura de frase de um caso para outro. Varie a redação a cada geração.

TOM: pedagógico, formal mas natural, redigido em português do Brasil, em texto corrido (não use bullet points na versão final). O caso ""Antônio"" do Caderno Pedagógico serve apenas como referência de tom e nível de detalhe — nunca copie frases dele literalmente.",
                        new DateTime(2026, 7, 31, 0, 0, 0, DateTimeKind.Utc),
                        new DateTime(2026, 7, 31, 0, 0, 0, DateTimeKind.Utc)
                    },
                    {
                        1, // TipoDocumentoIA.PAEE
                        "Prompt ainda não definido — documento fora do escopo desta fase (ver spec de geração de documentos via IA).",
                        new DateTime(2026, 7, 31, 0, 0, 0, DateTimeKind.Utc),
                        new DateTime(2026, 7, 31, 0, 0, 0, DateTimeKind.Utc)
                    },
                    {
                        2, // TipoDocumentoIA.AvaliacaoDiagnostica
                        "Prompt ainda não definido — documento fora do escopo desta fase (ver spec de geração de documentos via IA).",
                        new DateTime(2026, 7, 31, 0, 0, 0, DateTimeKind.Utc),
                        new DateTime(2026, 7, 31, 0, 0, 0, DateTimeKind.Utc)
                    },
                    {
                        3, // TipoDocumentoIA.RelatoAtendimento
                        "Prompt ainda não definido — documento fora do escopo desta fase (ver spec de geração de documentos via IA).",
                        new DateTime(2026, 7, 31, 0, 0, 0, DateTimeKind.Utc),
                        new DateTime(2026, 7, 31, 0, 0, 0, DateTimeKind.Utc)
                    },
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "prompt_sistema_ia",
                keyColumn: "tipodocumento",
                keyValues: new object[] { 0, 1, 2, 3 });

            migrationBuilder.DropTable(
                name: "prompt_sistema_ia");

            migrationBuilder.DropColumn(
                name: "textogeradoia",
                table: "estudos_caso");
        }
    }
}
