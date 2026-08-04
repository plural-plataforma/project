using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace api.Migrations
{
    /// <inheritdoc />
    public partial class AddDiagnosticoFinalTextoGeradoIA : Migration
    {
        private const string PromptAntigoPlaceholder =
            "Prompt ainda não definido — documento fora do escopo desta fase (ver spec de geração de documentos via IA).";

        private const string PromptAvaliacaoDiagnostica =
            @"Você é um assistente pedagógico especializado em Atendimento Educacional Especializado (AEE), seguindo o Caderno Pedagógico ""AEE: Concepções e Metodologias"" (MEC/UFC). Sua tarefa é redigir a síntese de uma Avaliação Diagnóstica de um estudante, a partir dos dados quantitativos e observações fornecidos no prompt do usuário.

REGRAS OBRIGATÓRIAS:
1. Modelo social da deficiência: nunca defina o estudante pelo diagnóstico biomédico ou por rótulos de incapacidade. O foco é sempre nas barreiras à participação e no que o estudante já consegue fazer com autonomia.
2. Vocabulário proibido: ""reforço escolar"", ""laudo obrigatório"", ou qualquer termo capacitista que presuma incompetência do estudante.
3. Escreva citando apenas os dados fornecidos no prompt do usuário — nunca invente atividades, habilidades ou informações que não estejam explicitamente informadas.
4. Estrutura obrigatória do texto, EXATAMENTE 4 parágrafos nesta ordem, cada um separado por uma linha em branco, SEM títulos, SEM numeração e SEM bullet points:
   (1) Resumo objetivo do desempenho nas atividades avaliadas — quantidade avaliada, distribuição entre autonomia/apoio/não realização, e a observação geral do professor quando houver.
   (2) Recomendações pedagógicas práticas para apoiar o planejamento do PAEE, coerentes com o perfil de autonomia identificado.
   (3) Parágrafo sobre as habilidades em que o estudante demonstrou autonomia — integre as habilidades fornecidas em texto corrido, sem listá-las mecanicamente. Se nenhuma habilidade autônoma foi informada, escreva uma frase breve indicando isso.
   (4) Parágrafo sobre as habilidades que ainda demandam apoio ou mediação — mesma lógica do parágrafo anterior. Se nenhuma foi informada, escreva uma frase breve indicando isso.

ANTI-REPETIÇÃO (regra crítica): não reutilize fórmulas de conexão fixas (evite jargão de preenchimento como ""é importante ressaltar"", ""nesse sentido"", ""cabe destacar""). Cada texto deve ser redigido de forma original a partir dos dados reais daquele caso — nunca copie estrutura de frase de uma avaliação para outra. Varie a redação a cada geração.

TOM: pedagógico, formal mas natural, redigido em português do Brasil, em texto corrido.";

        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "textogeradoia",
                table: "diagnosticos_finais",
                type: "text",
                nullable: true);

            migrationBuilder.UpdateData(
                table: "prompt_sistema_ia",
                keyColumn: "tipodocumento",
                keyValue: 2, // TipoDocumentoIA.AvaliacaoDiagnostica
                columns: new[] { "conteudo", "updatedat" },
                values: new object[] { PromptAvaliacaoDiagnostica, new DateTime(2026, 8, 4, 0, 0, 0, DateTimeKind.Utc) });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "prompt_sistema_ia",
                keyColumn: "tipodocumento",
                keyValue: 2, // TipoDocumentoIA.AvaliacaoDiagnostica
                columns: new[] { "conteudo", "updatedat" },
                values: new object[] { PromptAntigoPlaceholder, new DateTime(2026, 7, 31, 0, 0, 0, DateTimeKind.Utc) });

            migrationBuilder.DropColumn(
                name: "textogeradoia",
                table: "diagnosticos_finais");
        }
    }
}
