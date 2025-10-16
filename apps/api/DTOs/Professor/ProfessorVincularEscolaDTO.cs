using System.ComponentModel.DataAnnotations;

namespace api.DTOs.Professor
{
    public class ProfessorVincularEscolaDTO
    {
        [Required(ErrorMessage = "O campo idEscola é obrigatório.")]
        public int IdEscola { get; set; }
    }
}
