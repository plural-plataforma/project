using System.ComponentModel.DataAnnotations;

namespace api.DTOs.Autenticacao
{
    public class AlterarEmailDTO
    {
        [Required]
        public string NovoEmail { get; set; }

        [Required]
        public string SenhaAtual { get; set; }
    }
}