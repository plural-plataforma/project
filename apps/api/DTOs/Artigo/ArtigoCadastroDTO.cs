using System.ComponentModel.DataAnnotations;

namespace api.DTOs.Artigo
{
    public class ArtigoCadastroDTO
    {
        [Required]
        [MaxLength(200)]
        public string Titulo { get; set; } = string.Empty;

        // Opcional — se não vier, é gerado a partir do Titulo.
        [MaxLength(220)]
        public string? Slug { get; set; }

        [Required]
        [MaxLength(400)]
        public string Resumo { get; set; } = string.Empty;

        [Required]
        public string Conteudo { get; set; } = string.Empty;

        [MaxLength(100)]
        public string? Categoria { get; set; }

        [Required]
        [MaxLength(150)]
        public string Autor { get; set; } = string.Empty;

        [Range(1, 120)]
        public int TempoLeituraMinutos { get; set; }

        [MaxLength(500)]
        public string? ImagemCapaUrl { get; set; }

        public bool Publicado { get; set; } = false;
    }
}
