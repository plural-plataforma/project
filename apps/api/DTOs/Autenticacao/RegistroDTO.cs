using System.ComponentModel.DataAnnotations;

namespace api.DTOs.Autenticacao
{
    public class RegistroDTO
    {
        [Required(ErrorMessage = "O email é obrigatório")]
        [EmailAddress(ErrorMessage = "O email é inválido")]
        public string Email { get; set; }

        [Required(ErrorMessage = "A senha é obrigatória")]
        public string Senha { get; set; }

        [Required(ErrorMessage = "O Nome é obrigatório")]
        [StringLength(256)]
        public string NomeCompleto { get; set; }

        [Required(ErrorMessage = "É necessário aceitar os termos de uso")]
        public bool AceitouTermos { get; set; }

        public bool DeveAlterarSenha { get; set; } = false;


    }
}
