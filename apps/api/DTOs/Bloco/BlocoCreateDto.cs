using System.ComponentModel.DataAnnotations;

namespace api.DTOs.Bloco
{
    public class BlocoCreateDto
    {
        [Required]
        [StringLength(100)]
        public string Titulo { get; set; } = string.Empty;

        public int Ordem { get; set; }

        [StringLength(500)]
        public string? Observacao { get; set; }

        public bool Status { get; set; } = true;

        [StringLength(50)]
        public string? Icone { get; set; }
    }

    public class BlocoUpdateDto : BlocoCreateDto
    {
        // Pode adicionar campos que só fazem sentido na atualização, se necessário
    }
}
