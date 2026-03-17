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

        [StringLength(256)]
        [EmailAddress(ErrorMessage = "digite o e-mail do responsável")]
        public string? Email { get; set; }

    }
}