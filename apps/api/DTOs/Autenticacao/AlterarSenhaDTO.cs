using System.ComponentModel.DataAnnotations;

namespace api.DTOs.Autenticacao
{
    public class AlterarSenhaDTO
    {
        [Required]
        public string SenhaAtual { get; set; }

        [Required]
        public string NovaSenha { get; set; }
    }
}
