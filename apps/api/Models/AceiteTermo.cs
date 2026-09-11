using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace api.Models
{
    // Registro de auditoria LGPD: quem aceitou qual versão de qual termo e quando.
    [Table("aceites_termos")]
    public class AceiteTermo
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public string UsuarioId { get; set; } = string.Empty;
        public Usuario Usuario { get; set; } = null!;

        [Required]
        public int TermoVersaoId { get; set; }
        public TermoVersao TermoVersao { get; set; } = null!;

        public DateTime DataAceite { get; set; } = DateTime.UtcNow;

        [MaxLength(64)]
        public string? Ip { get; set; }
    }
}
