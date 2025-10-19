using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace api.DTOs.Responsavel
{
    public class ResponsavelCadastroSimplificadoDTO
    {
        [Required]
        [StringLength(100)]
        public string NomeCompleto { get; set; }

        [Required]
        [StringLength(20)]
        public string Telefone { get; set; }

        [Required]
        [StringLength(256)]
        public string Email { get; set; }

    }
}