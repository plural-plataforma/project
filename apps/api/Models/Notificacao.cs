using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace api.Models
{
    // Notificação assíncrona pro professor — hoje só avisa sobre geração de Relatório
    // Pedagógico em background (ver RelatorioGeracaoWorker), mas o campo Tipo permite outros
    // eventos no futuro sem migração nova. RelatorioId não é FK (mesmo padrão de
    // GeracaoIALog.DocumentoId) — é só referência pra navegação no front.
    [Table("notificacoes")]
    public class Notificacao
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int ProfessorId { get; set; }

        [Required]
        public TipoNotificacao Tipo { get; set; }

        [Required]
        [MaxLength(200)]
        public string Titulo { get; set; } = string.Empty;

        [Required]
        [Column(TypeName = "text")]
        public string Mensagem { get; set; } = string.Empty;

        public int? RelatorioId { get; set; }

        [Required]
        public bool Lida { get; set; } = false;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
