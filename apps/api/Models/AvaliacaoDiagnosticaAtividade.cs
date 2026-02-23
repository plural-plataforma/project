using System.ComponentModel.DataAnnotations.Schema;

namespace api.Models
{
    [Table("avaliacoes_diagnosticas_atividades")]
    public class AvaliacaoDiagnosticaAtividade
    {
        public int AvaliacaoDiagnosticaId { get; set; }
        public virtual AvaliacaoDiagnostica AvaliacaoDiagnostica { get; set; } = null!;

        public int AtividadeId { get; set; }
        public virtual Atividade Atividade { get; set; } = null!;
    }
}