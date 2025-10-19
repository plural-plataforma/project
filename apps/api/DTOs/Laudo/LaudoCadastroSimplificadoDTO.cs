using System.ComponentModel.DataAnnotations;

namespace api.DTOs.Laudo
{
    public class LaudoCadastroSimplificadoDTO
    {
        [Required]
        public string CodigoCid { get; set; }

        [Required]
        [MaxLength(256)]
        public string NomeMedico { get; set; }

        [Required]
        [MaxLength(2000)]
        public string Descricao { get; set; }
    }
}