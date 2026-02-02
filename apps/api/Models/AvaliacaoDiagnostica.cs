using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace api.Models
{
    [Table("avaliacoes_diagnosticas")]
    public class AvaliacaoDiagnostica
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Required]
        [StringLength(150)]
        public string Titulo { get; set; } = string.Empty;   // "Diagnóstico Abril 2025 - Turma EI"

        [Column(TypeName = "text")]
        public string? Objetivo { get; set; }                // "Identificar nível de alfabetização inicial"

        public DateTime DataAplicacao { get; set; } = DateTime.UtcNow.Date;

        [ForeignKey("Escola")]
        public int? EscolaId { get; set; }
        public virtual Escola? Escola { get; set; } = null!;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        public bool Concluida { get; set; } = false;

        // Relacionamentos importantes
        public virtual ICollection<AvaliacaoDiagnosticaBloco> BlocosSelecionados { get; set; } = new List<AvaliacaoDiagnosticaBloco>();

        public virtual ICollection<AvaliacaoDiagnosticaAtividade> AtividadesSelecionadas { get; set; } = new List<AvaliacaoDiagnosticaAtividade>();
        public virtual ICollection<AvaliacaoAluno> AlunosParticipantes { get; set; } = new List<AvaliacaoAluno>();
        public virtual ICollection<DesempenhoAtividade> RegistrosDesempenho { get; set; } = new List<DesempenhoAtividade>();
    }
}