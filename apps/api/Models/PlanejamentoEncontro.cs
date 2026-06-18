namespace api.Models;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

[Table("planejamento_encontros")]
public class PlanejamentoEncontro
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    public int PlanejamentoId { get; set; }

    [ForeignKey("PlanejamentoId")]
    public Planejamento Planejamento { get; set; } = null!;

    public DateOnly DataEnc { get; set; }

    public string? TextoPlanejado { get; set; }

    public string? TextoRealizado { get; set; }

    public int? HabilidadeId { get; set; }

    [ForeignKey("HabilidadeId")]
    public Habilidade? Habilidade { get; set; }

    public int? EstrategiaId { get; set; }

    [ForeignKey("EstrategiaId")]
    public Estrategias? Estrategia { get; set; }
}
