using System.ComponentModel.DataAnnotations;

namespace api.DTOs.Planejamento
{
    public class PlanejamentoVincularAvaliacoesLoteDTO
    {
        [Required(ErrorMessage = "O campo idPlanejamento é obrigatório.")]
        public int IdPlanejamento { get; set; }

        public List<int> IdAvaliacoes { get; set; } = [];
    }
}
