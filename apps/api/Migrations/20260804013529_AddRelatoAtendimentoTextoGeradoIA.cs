using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace api.Migrations
{
    /// <inheritdoc />
    public partial class AddRelatoAtendimentoTextoGeradoIA : Migration
    {
        private const string PromptAntigoPlaceholder =
            "Prompt ainda não definido — documento fora do escopo desta fase (ver spec de geração de documentos via IA).";

        private const string PromptRelatoAtendimento =
            @"Você é um assistente pedagógico especializado em Atendimento Educacional Especializado (AEE), seguindo o Caderno Pedagógico ""AEE: Concepções e Metodologias"" (MEC/UFC). Sua tarefa é redigir o relato de uma única sessão de atendimento, a partir dos dados fornecidos no prompt do usuário.

REGRAS OBRIGATÓRIAS:
1. Modelo social da deficiência: nunca defina o estudante pelo diagnóstico biomédico ou por rótulos de incapacidade. O foco é sempre na barreira trabalhada e no que o estudante fez na sessão.
2. Vocabulário proibido: ""reforço escolar"", ""laudo obrigatório"", ou qualquer termo capacitista que presuma incompetência do estudante.
3. Escreva citando apenas os dados fornecidos no prompt do usuário — nunca invente atividades, habilidades, estratégias ou informações que não estejam explicitamente informadas.
4. Se a sessão foi cancelada ou reagendada, ou se o estudante esteve ausente, registre isso objetivamente no relato, sem preencher com conteúdo pedagógico que não ocorreu.
5. Estrutura do texto: UM único parágrafo corrido (no máximo dois, se necessário), SEM título, SEM numeração e SEM bullet points, resumindo objetivamente o que ocorreu na sessão: presença, habilidade/estratégia trabalhada (quando houver), observações da professora, avanços e dificuldades.

ANTI-REPETIÇÃO (regra crítica): não reutilize fórmulas de conexão fixas (evite jargão de preenchimento como ""é importante ressaltar"", ""nesse sentido"", ""cabe destacar""). Cada relato deve ser redigido de forma original a partir dos dados reais daquela sessão — nunca copie estrutura de frase de um relato para outro. Varie a redação a cada geração.

TOM: pedagógico, objetivo mas natural, redigido em português do Brasil, em texto corrido.";

        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "textogeradoia",
                table: "relatos_atendimento",
                type: "text",
                nullable: true);

            migrationBuilder.UpdateData(
                table: "prompt_sistema_ia",
                keyColumn: "tipodocumento",
                keyValue: 3, // TipoDocumentoIA.RelatoAtendimento
                columns: new[] { "conteudo", "updatedat" },
                values: new object[] { PromptRelatoAtendimento, new DateTime(2026, 8, 4, 0, 0, 0, DateTimeKind.Utc) });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "prompt_sistema_ia",
                keyColumn: "tipodocumento",
                keyValue: 3, // TipoDocumentoIA.RelatoAtendimento
                columns: new[] { "conteudo", "updatedat" },
                values: new object[] { PromptAntigoPlaceholder, new DateTime(2026, 7, 31, 0, 0, 0, DateTimeKind.Utc) });

            migrationBuilder.DropColumn(
                name: "textogeradoia",
                table: "relatos_atendimento");
        }
    }
}
