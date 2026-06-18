using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace api.Models;

/// <summary>Eixos pedagógicos padrão para orientar o estudo de caso (seed).</summary>
[Table("estudo_caso_eixos_catalogo")]
public class EstudoDeCasoEixoCatalogo
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    [Required]
    [StringLength(50)]
    public string Codigo { get; set; } = string.Empty;

    [Required]
    [StringLength(160)]
    public string Rotulo { get; set; } = string.Empty;

    [Column(TypeName = "text")]
    public string? DescricaoHint { get; set; }

    public int OrdemExibicao { get; set; }

    public ICollection<EstudoDeCasoItemEixo> Itens { get; set; } = new List<EstudoDeCasoItemEixo>();
}
