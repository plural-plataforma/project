using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace api.Models
{
    // "Tipo" de termo (ex: uso da ferramenta, IA). Cada Termo tem várias TermoVersao ao
    // longo do tempo, mas só uma fica Ativa por vez.
    [Table("termos")]
    public class Termo
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(100)]
        public string Chave { get; set; } = string.Empty;

        [Required]
        [MaxLength(200)]
        public string Nome { get; set; } = string.Empty;

        public List<TermoVersao> Versoes { get; set; } = new();
    }
}
