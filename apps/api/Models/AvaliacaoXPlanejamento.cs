namespace api.Models;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;


[Table("avaliacaoxplanejamento")]
public class AvaliacaoXPlanejamento
{

    [Key, Column("avaliacaoid", Order = 0)]
    public int AvaliacaoId { get; set; }

    [Key, Column("planejamentoid", Order = 1)]
    public int PlanejamentoId { get; set; }

    [ForeignKey("AvaliacaoId")]
    public Avaliacao Avaliacao { get; set; }

    [ForeignKey("PlanejamentoId")]
    public Planejamento Planejamento { get; set; }
}
