using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace api.Models;

/// <summary>Estudo de caso vinculado ao aluno para sustentar planejamento PAEE.</summary>
[Table("estudos_caso")]
public class EstudoDeCaso
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    public int AlunoId { get; set; }

    /// <summary>Professor proprietário (espelha aluno.IdProfessor para consultas rápidas).</summary>
    public int ProfessorId { get; set; }

    [Required]
    [StringLength(200)]
    public string Titulo { get; set; } = string.Empty;

    [Column(TypeName = "text")]
    public string ContextoSituacao { get; set; } = string.Empty;

    /// <summary>Pontos fortes e habilidades preservadas registrados pelo professor.</summary>
    [Column(TypeName = "text")]
    public string? Potencialidades { get; set; }

    /// <summary>Rascunho gerado automaticamente (simulação — revisão humana obrigatória).</summary>
    [Column(TypeName = "text")]
    public string? TextoSimulado { get; set; }

    /// <summary>Texto gerado por IA (Gemini/Claude) — paralelo ao TextoSimulado, revisão humana obrigatória.</summary>
    [Column(TypeName = "text")]
    public string? TextoGeradoIA { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    [ForeignKey(nameof(AlunoId))]
    public Aluno Aluno { get; set; } = null!;

    [ForeignKey(nameof(ProfessorId))]
    public Professor Professor { get; set; } = null!;

    public ICollection<EstudoDeCasoItemEixo> ItensEixo { get; set; } = new List<EstudoDeCasoItemEixo>();
}
