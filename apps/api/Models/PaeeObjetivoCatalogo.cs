using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace api.Models;

/// <summary>Objetivos-tipo do PAEE por prazo (curto, médio, longo) — seed pedagógico.</summary>
[Table("paee_objetivos_catalogo")]
public class PaeeObjetivoCatalogo
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    [Required]
    [StringLength(60)]
    public string Codigo { get; set; } = string.Empty;

    [Required]
    [StringLength(160)]
    public string Rotulo { get; set; } = string.Empty;

    [Column(TypeName = "text")]
    public string TextoModelo { get; set; } = string.Empty;

    public PaeeObjetivoPrazo Prazo { get; set; }

    public int OrdemExibicao { get; set; }
}
