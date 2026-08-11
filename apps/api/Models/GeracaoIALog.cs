using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace api.Models
{
    // Registro de cada tentativa de geração de texto por IA (sucesso ou falha), pra levantar
    // dado real de uso por professora antes de decidir limite (cooldown/teto diário).
    [Table("geracao_ia_log")]
    public class GeracaoIALog
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int ProfessorId { get; set; }

        [Required]
        public TipoDocumentoIA TipoDocumento { get; set; }

        // Id do registro gerado (EstudoCaso/Planejamento/AvaliacaoDiagnostica/RelatoAtendimento,
        // conforme o TipoDocumento) — não é FK, só referência pra investigação pontual.
        public int DocumentoId { get; set; }

        public int? AlunoId { get; set; }

        [Required]
        public bool Sucesso { get; set; }

        public DateTime CriadoEm { get; set; } = DateTime.UtcNow;
    }
}
