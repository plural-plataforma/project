namespace api.DTOs.AvaliacaoDiagnostica;

public class DiagnosticoFinalDTO
{
    public int Id { get; set; }
    public int AvaliacaoDiagnosticaId { get; set; }
    public int AlunoId { get; set; }
    public string AlunoNomeCompleto { get; set; } = string.Empty;
    public string Resumo { get; set; } = string.Empty;
    public string NivelPerfilAutonomia { get; set; } = string.Empty;
    public string RotuloExibicao { get; set; } = string.Empty;
    public string Recomendacoes { get; set; } = string.Empty;
    public string? HabilidadesFortes { get; set; }
    public string? HabilidadesAReenforcar { get; set; }
    public string? TextoGeradoIA { get; set; }
    public DateTime GeradoEm { get; set; }
}

public class SugestoesPaeeAlunoDTO
{
    public int AlunoId { get; set; }
    public string NivelPerfilAutonomia { get; set; } = string.Empty;
    public string RotuloExibicao { get; set; } = string.Empty;
    public string SugestaoPaee { get; set; } = string.Empty;
    public string? HabilidadesFortes { get; set; }
    public string? HabilidadesAReenforcar { get; set; }
}
