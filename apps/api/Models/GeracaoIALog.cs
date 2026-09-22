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

        // Tentativa recusada pelo limite diário (LimiteUsoIAService) antes de chamar a IA —
        // sempre com Sucesso = false. Fica separada das falhas da IA pra não distorcer a taxa
        // de sucesso e pra mostrar no painel admin quem esbarra no limite.
        public bool BloqueadoPorLimite { get; set; }

        public DateTime CriadoEm { get; set; } = DateTime.UtcNow;
    }
}
