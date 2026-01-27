using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace api.Models
{
    [Table("desempenhos_atividades")]
    public class DesempenhoAtividade
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        public int AvaliacaoDiagnosticaId { get; set; }
        public virtual AvaliacaoDiagnostica AvaliacaoDiagnostica { get; set; } = null!;

        public int AtividadeId { get; set; }
        public virtual Atividade Atividade { get; set; } = null!;

        public int AlunoId { get; set; }
        public virtual Aluno Aluno { get; set; } = null!;

        [StringLength(50)]
        public string NivelRealizacao { get; set; } = "NaoAvaliado";  // Autonomia, ComAjuda, NaoRealizou, NaoAvaliado

        [Column(TypeName = "text")]
        public string? Observacao { get; set; }

        public DateTime DataRegistro { get; set; } = DateTime.UtcNow;
    }
}