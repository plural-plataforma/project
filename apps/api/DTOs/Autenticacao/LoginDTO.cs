using System.ComponentModel.DataAnnotations;

namespace api.DTOs.Autenticacao
{
    public class LoginDTO
    {

        [Required]
        [EmailAddress]
        public string Email { get; set; }

        [Required]
        public string Senha { get; set; }
    }
}
