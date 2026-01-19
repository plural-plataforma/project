using System.ComponentModel.DataAnnotations;

namespace api.DTOs.Atividade
{
    public class AtividadeCadastroDTO
    {
        [Required]
        [MaxLength(100)]
        public string Titulo { get; set; } = string.Empty;

        public string Enunciado { get; set; } = string.Empty;

        [Required]
        public int BlocoId { get; set; }

        [Required]
        public string Nivel { get; set; } = string.Empty; // "Facil", "Medio", "Dificil"

        [Required]
        [MaxLength(10)]
        public string EtapaMin { get; set; } = string.Empty;

        [MaxLength(10)]
        public string? EtapaMax { get; set; }

        public IFormFile? Imagem { get; set; } // Para upload (não URL direta)

        public List<int>? HabilidadeIds { get; set; } // Para sync no create
    }
}
