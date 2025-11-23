using System.ComponentModel.DataAnnotations;

namespace api.DTOs.Planejamento
{
    public class PlanejamentoVincularEstrategiaDTO
    {
        [Required(ErrorMessage = "O campo idPlanejamento é obrigatório.")]
        public int IdPlanejamento { get; set; }

        [Required(ErrorMessage = "O campo idEstrategia é obrigatório.")]
        public int IdEstrategia { get; set; }
    }
}
