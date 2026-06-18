using System.ComponentModel.DataAnnotations;

namespace api.DTOs.Planejamento;

public class PlanejamentoEncontrosSubstituicaoDTO
{
    [Required]
    public List<PaeeEncontroEntradaDTO> Encontros { get; set; } = [];
}
