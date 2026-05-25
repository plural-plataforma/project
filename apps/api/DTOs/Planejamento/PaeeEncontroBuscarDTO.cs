namespace api.DTOs.Planejamento;

public class PaeeEncontroBuscarDTO
{
    public int Id { get; set; }

    public DateOnly DataEnc { get; set; }

    public string? TextoPlanejado { get; set; }

    public string? TextoRealizado { get; set; }

    public int? HabilidadeId { get; set; }

    public int? EstrategiaId { get; set; }
}
