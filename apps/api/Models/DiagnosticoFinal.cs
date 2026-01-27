using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace api.Models
{
    [Table("diagnosticos_finais")]
    public class DiagnosticoFinal
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        public int AvaliacaoDiagnosticaId { get; set; }
        public virtual AvaliacaoDiagnostica AvaliacaoDiagnostica { get; set; } = null!;

        public int AlunoId { get; set; }
        public virtual Aluno Aluno { get; set; } = null!;

        [Column(TypeName = "text")]
        public string Resumo { get; set; } = string.Empty;

        public double PercentualAutonomia { get; set; }   // ex: 75.0

        [Column(TypeName = "text")]
        public string Recomendacoes { get; set; } = string.Empty;

        public DateTime GeradoEm { get; set; } = DateTime.UtcNow;
    }
}