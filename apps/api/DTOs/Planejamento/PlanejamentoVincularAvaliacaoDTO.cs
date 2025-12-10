using System.ComponentModel.DataAnnotations;

namespace api.DTOs.Planejamento
{
    public class PlanejamentoVincularAvaliacaoDTO
    {
        [Required(ErrorMessage = "O campo idPlanejamento é obrigatório.")]
        public int IdPlanejamento { get; set; }

        [Required(ErrorMessage = "O campo idAvaliação é obrigatório.")]
        public int IdAvaliacao { get; set; }
    }
}
