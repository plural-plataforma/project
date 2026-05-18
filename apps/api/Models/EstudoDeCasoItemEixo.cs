using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace api.Models;

[Table("estudo_caso_itens_eixo")]
public class EstudoDeCasoItemEixo
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    public int EstudoDeCasoId { get; set; }

    public int EixoCatalogoId { get; set; }

    [Column(TypeName = "text")]
    public string? Anotacao { get; set; }

    [ForeignKey(nameof(EstudoDeCasoId))]
    public EstudoDeCaso EstudoDeCaso { get; set; } = null!;

    [ForeignKey(nameof(EixoCatalogoId))]
    public EstudoDeCasoEixoCatalogo CatalogoEixo { get; set; } = null!;
}
