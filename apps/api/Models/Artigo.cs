using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace api.Models
{
    [Table("artigo")]
    public class Artigo
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [StringLength(200)]
        public string Titulo { get; set; } = string.Empty;

        [Required]
        [StringLength(220)]
        public string Slug { get; set; } = string.Empty;

        [Required]
        [StringLength(400)]
        public string Resumo { get; set; } = string.Empty;

        // Conteúdo em Markdown — renderizado pela LP e pré-visualizado no admin.
        [Required]
        [Column(TypeName = "text")]
        public string Conteudo { get; set; } = string.Empty;

        [StringLength(100)]
        public string? Categoria { get; set; }

        [Required]
        [StringLength(150)]
        public string Autor { get; set; } = string.Empty;

        public int TempoLeituraMinutos { get; set; }

        // URL pública do Supabase Storage — upload feito direto pelo admin, API só guarda o link.
        [StringLength(500)]
        public string? ImagemCapaUrl { get; set; }

        public bool Publicado { get; set; } = false;
        public DateTime? PublicadoEm { get; set; }

        public bool Ativo { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
