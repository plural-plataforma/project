using System.ComponentModel.DataAnnotations;
using api.Models;

namespace api.DTOs.Relatorio;

public class RelatorioCadastroDTO
{
    [Required]
    public int AlunoId { get; set; }

    [Required]
    public DateOnly DataInicio { get; set; }

    [Required]
    public DateOnly DataFim { get; set; }

    [Required]
    public RelatorioTipoPeriodo TipoPeriodo { get; set; }
}
