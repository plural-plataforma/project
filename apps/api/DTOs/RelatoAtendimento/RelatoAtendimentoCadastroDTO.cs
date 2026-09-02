using System.ComponentModel.DataAnnotations;
using api.Models;

namespace api.DTOs.RelatoAtendimento;

public class RelatoAtendimentoCadastroDTO
{
    [Required]
    public int AlunoId { get; set; }

    // Obrigatório na prática para registros novos — validado em RelatoAtendimentoService
    // (mantido int? porque o ModelBinding não distingue "não veio" de "veio 0").
    public int? PlanejamentoId { get; set; }

    [Required]
    public DateOnly DataSessao { get; set; }

    [Required]
    public bool PresencaPresente { get; set; }

    [Required]
    public RelatoTipoOcorrencia TipoOcorrencia { get; set; }

    public int? HabilidadeId { get; set; }

    public int? EstrategiaId { get; set; }

    public string? Observacoes { get; set; }

    public List<string> Avancos { get; set; } = [];

    public List<string> Dificuldades { get; set; } = [];
}
