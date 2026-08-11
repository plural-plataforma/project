using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace api.Models;

[Table("relatos_atendimento")]
public class RelatoAtendimento
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    public int AlunoId { get; set; }

    [ForeignKey("AlunoId")]
    public Aluno Aluno { get; set; } = null!;

    /// <summary>PAEE vinculado; quando informado, habilidade/estratégia devem constar no plano.</summary>
    public int? PlanejamentoId { get; set; }

    [ForeignKey("PlanejamentoId")]
    public Planejamento? Planejamento { get; set; }

    public DateOnly DataSessao { get; set; }

    /// <summary>Presença do aluno na sessão (obrigatório informar true ou false).</summary>
    public bool PresencaPresente { get; set; }

    public RelatoTipoOcorrencia TipoOcorrencia { get; set; }

    public int? HabilidadeId { get; set; }

    [ForeignKey("HabilidadeId")]
    public Habilidade? Habilidade { get; set; }

    public int? EstrategiaId { get; set; }

    [ForeignKey("EstrategiaId")]
    public Estrategias? Estrategia { get; set; }

    [Column(TypeName = "text")]
    public string? Observacoes { get; set; }

    /// <summary>JSON array de strings.</summary>
    [Column(TypeName = "text")]
    public string AvancosJson { get; set; } = "[]";

    /// <summary>JSON array de strings.</summary>
    [Column(TypeName = "text")]
    public string DificuldadesJson { get; set; } = "[]";

    [Column(TypeName = "text")]
    public string? TextoGeradoIA { get; set; }
}
