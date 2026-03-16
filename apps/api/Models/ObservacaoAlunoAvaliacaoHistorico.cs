using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace api.Models
{
    [Table("observacoes_alunos_avaliacao_historico")]
    public class ObservacaoAlunoAvaliacaoHistorico
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        public int AvaliacaoDiagnosticaId { get; set; }
        public int AlunoId { get; set; }

        [Column(TypeName = "text")]
        public string Observacao { get; set; } = string.Empty;

        public DateTime DataRegistro { get; set; } = DateTime.UtcNow;
    }
}
