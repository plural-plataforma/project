using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace api.Models
{
    [Table("laudos")]
    public class Laudo
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public long Id { get; set; }

        public string CodigoCid { get; set; }

        [MaxLength(256)]
        public string NomeMedico { get; set; }

        [MaxLength(2000)]
        public string Descricao { get; set; }

        public int IdAluno { get; set; }

        [ForeignKey("IdAluno")]
        public Aluno Aluno { get; set; }
    }
}