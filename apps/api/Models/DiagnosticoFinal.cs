using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using api.Constants;

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

        /// <summary>
        /// Perfil agregado de autonomia (substitui o percentual numérico legado).
        /// Valores: NaoAvaliado, PredominioDependencia, AutonomiaMediada, PredominioAutonomia.
        /// </summary>
        [StringLength(40)]
        public string NivelPerfilAutonomia { get; set; } = NivelPerfilAutonomiaValores.NaoAvaliado;

        [Column(TypeName = "text")]
        public string Recomendacoes { get; set; } = string.Empty;

        [Column(TypeName = "text")]
        public string? HabilidadesFortes { get; set; }

        [Column(TypeName = "text")]
        public string? HabilidadesAReenforcar { get; set; }

        public DateTime GeradoEm { get; set; } = DateTime.UtcNow;
    }
}