using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace api.Models
{
    [Table("alunosxplanejamento")]
    public class AlunosXPlanejamento
    {
        [Key, Column("alunoid", Order = 0)]
        public int AlunoId { get; set; }

        [Key, Column("planejamentoid", Order = 1)]
        public int PlanejamentoId { get; set; }

        [ForeignKey("AlunoId")]
        public Aluno Aluno { get; set; }

        [ForeignKey("PlanejamentoId")]
        public Planejamento Planejamento { get; set; }

    }
}