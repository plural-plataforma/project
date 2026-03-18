using System.ComponentModel.DataAnnotations.Schema;

namespace api.Models
{
    [Table("avaliacoes_alunos")]
    public class AvaliacaoAluno
    {
        public int AvaliacaoDiagnosticaId { get; set; }
        public virtual AvaliacaoDiagnostica AvaliacaoDiagnostica { get; set; } = null!;

        public int AlunoId { get; set; }
        public virtual Aluno Aluno { get; set; } = null!;

        public string Status { get; set; } = "Pendente";   // Pendente, EmAndamento, Concluida
        public DateTime? DataConclusaoRegistro { get; set; }
        public string? ObservacaoGeral { get; set; }
    }
}