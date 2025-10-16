using System.ComponentModel.DataAnnotations;

namespace api.DTOs.Planejamento
{
    public class PlanejamentoCadastroDTO
    {
        [Required]
        public string Apelido { get; set; }

        [Required]
        public DateOnly DataInicio { get; set; }

        [Required]
        public DateOnly DataFim { get; set; }

    }
}
