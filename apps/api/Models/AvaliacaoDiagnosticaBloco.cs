using System.ComponentModel.DataAnnotations.Schema;

namespace api.Models
{
    [Table("avaliacoes_diagnosticas_blocos")]
    public class AvaliacaoDiagnosticaBloco
    {
        public int AvaliacaoDiagnosticaId { get; set; }
        public virtual AvaliacaoDiagnostica AvaliacaoDiagnostica { get; set; } = null!;

        public int BlocoId { get; set; }
        public virtual Bloco Bloco { get; set; } = null!;

        public int OrdemApresentacao { get; set; } = 0;   // 1, 2, 3... para sequência no app
    }
}