using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace api.Models
{
    [Table("prompt_sistema_ia")]
    public class PromptSistemaIA
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public TipoDocumentoIA TipoDocumento { get; set; }

        [Required]
        [Column(TypeName = "text")]
        public string Conteudo { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
