using System.ComponentModel.DataAnnotations;

namespace api.DTOs.Planejamento
{
    public class PlanejamentoVincularAlunoDTO
    {
        [Required(ErrorMessage = "O campo idPlanejamento é obrigatório.")]
        public int IdPlanejamento { get; set; }

        [Required(ErrorMessage = "O campo idAluno é obrigatório.")]
        public int IdAluno { get; set; }

    }
}
