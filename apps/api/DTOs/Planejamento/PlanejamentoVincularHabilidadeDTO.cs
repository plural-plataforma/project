using System.ComponentModel.DataAnnotations;

namespace api.DTOs.Planejamento
{
    public class PlanejamentoVincularHabilidadeDTO
    {
        [Required(ErrorMessage = "O campo idPlanejamento é obrigatório.")]
        public int IdPlanejamento { get; set; }

        [Required(ErrorMessage = "O campo idHabilidade é obrigatório.")]
        public int IdHabilidade { get; set; }
    }
}