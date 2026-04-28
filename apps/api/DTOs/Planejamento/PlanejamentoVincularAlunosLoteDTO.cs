using System.ComponentModel.DataAnnotations;

namespace api.DTOs.Planejamento
{
    public class PlanejamentoVincularAlunosLoteDTO
    {
        [Required(ErrorMessage = "O campo idPlanejamento é obrigatório.")]
        public int IdPlanejamento { get; set; }

        [Required(ErrorMessage = "A lista idAlunos é obrigatória.")]
        [MinLength(1, ErrorMessage = "Informe pelo menos um aluno.")]
        public List<int> IdAlunos { get; set; } = [];
    }
}
