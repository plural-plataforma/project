namespace api.Models;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

[Table("planejamentos")]
public class Planejamento
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int ID { get; set; }

    public string Apelido { get; set; }

    public DateOnly DataInicio { get; set; }

    public DateOnly DataFim { get; set; }
    public int IdProfessor { get; set; }

    [ForeignKey("IdProfessor")]
    public Professor Professor { get; set; }

    public string DescicaoPlanejamento { get; set; }

    public string? ObjetivoCurtoPrazo { get; set; }

    public string? ObjetivoMedioPrazo { get; set; }

    public string? ObjetivoLongoPrazo { get; set; }

    public int? ObjetivoCurtoCatalogoId { get; set; }

    [ForeignKey(nameof(ObjetivoCurtoCatalogoId))]
    public PaeeObjetivoCatalogo? ObjetivoCurtoCatalogo { get; set; }

    public int? ObjetivoMedioCatalogoId { get; set; }

    [ForeignKey(nameof(ObjetivoMedioCatalogoId))]
    public PaeeObjetivoCatalogo? ObjetivoMedioCatalogo { get; set; }

    public int? ObjetivoLongoCatalogoId { get; set; }

    [ForeignKey(nameof(ObjetivoLongoCatalogoId))]
    public PaeeObjetivoCatalogo? ObjetivoLongoCatalogo { get; set; }

    public bool DocumentoDeclaradoAssinado { get; set; }

    public string? AssinaturaNomeResponsavel { get; set; }

    public string? AssinaturaCargo { get; set; }

    public ICollection<HabilidadesXPlanejamento> HabilidadesXPlanejamentos { get; set; }

    public ICollection<EstrategiasXPlanejamento> EstrategiasXPlanejamentos { get; set; }

    public ICollection<AvaliacaoXPlanejamento> AvaliacaoXPlanejamentos { get; set; }
    public ICollection<AlunosXPlanejamento> AlunosXPlanejamentos { get; set; }

    public ICollection<PlanejamentoEncontro> Encontros { get; set; } = [];

}