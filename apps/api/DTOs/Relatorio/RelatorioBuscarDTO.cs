using api.Models;

namespace api.DTOs.Relatorio;

public class RelatorioBuscarDTO
{
    public int Id { get; set; }

    public int AlunoId { get; set; }

    public string AlunoNome { get; set; } = "";

    public DateOnly DataInicio { get; set; }

    public DateOnly DataFim { get; set; }

    public RelatorioTipoPeriodo TipoPeriodo { get; set; }

    public RelatorioStatus Status { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    public List<RelatorioSecaoDTO> Secoes { get; set; } = [];
}
