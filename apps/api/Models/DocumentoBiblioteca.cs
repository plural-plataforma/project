using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace api.Models
{
    [Table("documento_biblioteca")]
    public class DocumentoBiblioteca
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [StringLength(200)]
        public string Nome { get; set; } = string.Empty;

        [StringLength(100)]
        public string? Categoria { get; set; }

        [Required]
        [StringLength(255)]
        public string NomeArquivoOriginal { get; set; } = string.Empty;

        [Required]
        public byte[] ConteudoArquivo { get; set; } = Array.Empty<byte>();

        public long TamanhoBytes { get; set; }

        public bool Ativo { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
