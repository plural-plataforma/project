using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace api.Models
{
    public class Aluno
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Required]
        [StringLength(100)]
        public string Nome { get; set; }

        [Required]
        [StringLength(100)]
        public string Sobrenome { get; set; }

        [Required]
        [StringLength(254)]
        [EmailAddress]
        public string Email { get; set; }

        [Required]
        [StringLength(256)]
        public string Senha { get; set; }

        [StringLength(9)]
        public string Cep { get; set; }

        [StringLength(50)]
        public string Logradouro { get; set; }

        public int Numero { get; set; }

        [StringLength(100)]
        public string Complemento { get; set; }

        [StringLength(50)]
        public string Bairro { get; set; }

        [StringLength(40)]
        public string Estado { get; set; }

        [StringLength(40)]
        public string Cidade { get; set; }

        public int Telefone { get; set; }

        public int IdResponsavel { get; set; }
        public int IdProfessor { get; set; }
        public int IdEscola { get; set; }

        [StringLength(20)]
        public string NivelEnsino { get; set; }

        [StringLength(45)]
        public string Ano { get; set; }

        [StringLength(10)]
        public string Turno { get; set; }

        [ForeignKey("IdResponsavel")]
        public virtual Responsavel Responsavel { get; set; }

        [ForeignKey("IdProfessor")]
        public virtual Professor Professor { get; set; }

        [ForeignKey("IdEscola")]
        public virtual Escola Escola { get; set; }

    }
}
