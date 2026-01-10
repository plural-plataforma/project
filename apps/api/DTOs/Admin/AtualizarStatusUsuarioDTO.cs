using System.ComponentModel.DataAnnotations;

namespace api.DTOs.Admin
{
    public class AtualizarStatusUsuarioDTO
    {
        [Required]
        public int IdUsuario { get; set; }

        [Required]
        [RegularExpression("^[AI]$", ErrorMessage = "Ação deve ser 'A' (Ativar) ou 'I' (Inativar).")]
        public string Acao { get; set; } = null!;
    }
}
