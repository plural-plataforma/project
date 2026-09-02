using api.Models;

namespace api.DTOs.Relatorio;

// Versão enxuta de RelatorioBuscarDTO pra listagem — sem as seções (evita payload pesado
// quando o professor só quer ver quais relatórios já existem pro aluno).
public class RelatorioResumoDTO
{
    public int Id { get; set; }

    public int AlunoId { get; set; }

    public string AlunoNome { get; set; } = "";

    public string? AlunoAno { get; set; }

    public int? EscolaId { get; set; }

    public string? EscolaNomeInstituicao { get; set; }

    public DateOnly DataInicio { get; set; }

    public DateOnly DataFim { get; set; }

    public RelatorioTipoPeriodo TipoPeriodo { get; set; }

    public RelatorioStatus Status { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }
}
