using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace api.Models
{
    [Table("alunos")]
    public class Aluno
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Required]
        [StringLength(256)]
        public string NomeCompleto { get; set; }

        [StringLength(9)]
        public string? Cep { get; set; }

        [StringLength(50)]
        public string? Logradouro { get; set; }

        public int? Numero { get; set; }

        [StringLength(100)]
        public string? Complemento { get; set; }

        [StringLength(50)]
        public string? Bairro { get; set; }

        [StringLength(40)]
        public string? Estado { get; set; }

        [StringLength(40)]
        public string? Cidade { get; set; }

        [StringLength(20)]
        public string? Telefone { get; set; }
        public int IdProfessor { get; set; }
        public int IdEscola { get; set; }
        public int? IdResponsavel { get; set; }

        [StringLength(20)]
        public string? NivelEnsino { get; set; }

        [StringLength(45)]
        public string? Ano { get; set; }

        [StringLength(10)]
        public string? Turno { get; set; }

        [MaxLength(1)]
        public string? Sexo { get; set; }

        /// <summary>Data de nascimento do aluno (idade cronológica para análise pedagógica).</summary>
        public DateOnly? DataNascimento { get; set; }

        /// <summary>Quantas vezes por semana o aluno é atendido no AEE.</summary>
        public int? FrequenciaSemanalAtendimento { get; set; }

        /// <summary>JSON: lista de dias, ex.: ["Segunda","Quinta"].</summary>
        [Column(TypeName = "text")]
        public string? DiasSemanaAtendimentoJson { get; set; }

        /// <summary>Duração de cada atendimento em minutos.</summary>
        public int? DuracaoAtendimentoMinutos { get; set; }

        public TipoAtendimentoAee? TipoAtendimentoAee { get; set; }

        [Column(TypeName = "text")]
        public string? PerfilPedagogicoPotencialidades { get; set; }

        [Column(TypeName = "text")]
        public string? PerfilPedagogicoNecessidades { get; set; }

        [ForeignKey("IdProfessor")]
        public Professor Professor { get; set; }

        [ForeignKey("IdEscola")]
        public Escola Escola { get; set; }

        [ForeignKey("IdResponsavel")]
        public Responsavel? Responsavel { get; set; }

        public ICollection<AlunosXPlanejamento> AlunosXPlanejamentos{ get; set; }

        public ICollection<Laudo> Laudos { get; set; }
    }
}
