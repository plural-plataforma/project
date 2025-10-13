using System.ComponentModel.DataAnnotations;

namespace api.DTOs.Professor
{
    public class VincularEscolaDTO
    {
        [Required(ErrorMessage = "O campo idEscola é obrigatório.")]
        public int IdEscola { get; set; }
    }
}
