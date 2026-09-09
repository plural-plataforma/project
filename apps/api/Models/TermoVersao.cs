using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace api.Models
{
    [Table("termos_versoes")]
    public class TermoVersao
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int TermoId { get; set; }
        public Termo Termo { get; set; } = null!;

        [Required]
        public int Versao { get; set; }

        [Required]
        [Column(TypeName = "text")]
        public string Texto { get; set; } = string.Empty;

        public DateTime PublicadoEm { get; set; } = DateTime.UtcNow;

        [Required]
        public bool Ativo { get; set; } = true;
    }
}
