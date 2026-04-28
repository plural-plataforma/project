using System.ComponentModel.DataAnnotations;

namespace api.DTOs.Planejamento
{
    public class PlanejamentoVincularHabilidadesLoteDTO
    {
        [Required(ErrorMessage = "O campo idPlanejamento é obrigatório.")]
        public int IdPlanejamento { get; set; }

        public List<int> IdHabilidades { get; set; } = [];
    }
}
