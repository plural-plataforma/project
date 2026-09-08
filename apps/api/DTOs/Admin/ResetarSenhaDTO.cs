// api.DTOs.Admin/ResetarSenhaDTO.cs
using System.ComponentModel.DataAnnotations;

namespace api.DTOs.Admin
{
    public class ResetarSenhaDTO
    {
        [Required(ErrorMessage = "O ID do usuário (Professor) é obrigatório")]
        public int IdUsuario { get; set; }
    }
}
