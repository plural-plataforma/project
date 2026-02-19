using System.ComponentModel.DataAnnotations;

namespace api.DTOs.Bloco
{
    public class BlocoCadastroDTO
    {
        [Required, MaxLength(100)]
        public string? Titulo { get; set; } = string.Empty;

        public int Ordem { get; set; }
        public string? Observacao { get; set; }
        public string? Icone { get; set; }
    }
}
