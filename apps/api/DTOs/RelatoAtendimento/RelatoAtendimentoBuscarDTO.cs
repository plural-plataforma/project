using api.Models;

namespace api.DTOs.RelatoAtendimento;

public class RelatoAtendimentoBuscarDTO
{
    public int Id { get; set; }

    public int AlunoId { get; set; }

    public string AlunoNome { get; set; } = "";

    public int? PlanejamentoId { get; set; }

    public string? PlanejamentoApelido { get; set; }

    public DateOnly DataSessao { get; set; }

    public bool PresencaPresente { get; set; }

    public RelatoTipoOcorrencia TipoOcorrencia { get; set; }

    public int? HabilidadeId { get; set; }

    public string? HabilidadeResumo { get; set; }

    public int? EstrategiaId { get; set; }

    public string? EstrategiaDescricao { get; set; }

    public string? Observacoes { get; set; }

    public List<string> Avancos { get; set; } = [];

    public List<string> Dificuldades { get; set; } = [];

    public string? TextoGeradoIA { get; set; }
}
