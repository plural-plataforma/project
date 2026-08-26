using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace api.Models
{
    // As 15 seções do template ficam de fora daqui: Identificação é preenchida
    // diretamente do cadastro do aluno na exportação, sem passar por geração/edição.
    public enum RelatorioSecaoChave
    {
        Contextualizacao = 0,
        Potencialidades = 1,
        Comunicacao = 2,
        Cognicao = 3,
        Academico = 4,
        Interacao = 5,
        Autonomia = 6,
        MotorSensorial = 7,
        Barreiras = 8,
        Estrategias = 9,
        Evolucao = 10,
        Necessidades = 11,
        Encaminhamentos = 12,
        Conclusao = 13,
    }

    [Table("relatorio_pedagogico_secoes")]
    public class RelatorioSecao
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Required]
        public int RelatorioId { get; set; }
        public virtual Relatorio? Relatorio { get; set; }

        [Required]
        public RelatorioSecaoChave SecaoChave { get; set; }

        // Texto original gerado pela IA — preservado mesmo após edição, para auditoria.
        [Column(TypeName = "text")]
        public string? TextoGerado { get; set; }

        // Texto final (editado pela professora ou preenchido manualmente quando a seção
        // não teve dado suficiente pra IA gerar).
        [Column(TypeName = "text")]
        public string? TextoEditado { get; set; }

        [Column(TypeName = "text")]
        public string? NotasManuais { get; set; }

        public DateTime? GeradoEm { get; set; }
        public DateTime? EditadoEm { get; set; }
    }
}
