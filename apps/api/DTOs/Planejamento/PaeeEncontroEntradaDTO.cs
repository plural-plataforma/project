using System.ComponentModel.DataAnnotations;

namespace api.DTOs.Planejamento;

public class PaeeEncontroEntradaDTO
{
    [Required]
    public DateOnly DataEnc { get; set; }

    public string? TextoPlanejado { get; set; }

    public string? TextoRealizado { get; set; }

    public int? HabilidadeId { get; set; }

    public int? EstrategiaId { get; set; }
}
