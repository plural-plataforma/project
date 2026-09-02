using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace api.Models
{
    public enum RelatorioTipoPeriodo
    {
        Trimestral = 0,
        Semestral = 1,
    }

    public enum RelatorioStatus
    {
        Rascunho = 0,
        Finalizado = 1,
    }

    // Documento consolidado por período (fotografia): uma vez finalizado, não recalcula
    // mesmo que os dados de origem (relatos, PAEE, estudo de caso) mudem depois.
    [Table("relatorios_pedagogicos")]
    public class Relatorio
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Required]
        public int AlunoId { get; set; }
        public virtual Aluno? Aluno { get; set; }

        [Required]
        public int ProfessorId { get; set; }
        public virtual Professor? Professor { get; set; }

        public int? EscolaId { get; set; }
        public virtual Escola? Escola { get; set; }

        public DateOnly DataInicio { get; set; }
        public DateOnly DataFim { get; set; }

        [Required]
        public RelatorioTipoPeriodo TipoPeriodo { get; set; }

        [Required]
        public RelatorioStatus Status { get; set; } = RelatorioStatus.Rascunho;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public virtual ICollection<RelatorioSecao> Secoes { get; set; } = new List<RelatorioSecao>();
    }
}
