using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace api.Models
{
    [Table("escolasxprofessores")]
    public class EscolaXProfessor
    {
        [Key, Column("escolaid",Order = 0)]
        public int EscolaId { get; set; }

        [Key, Column("professorid", Order = 1)]
        public int ProfessorId { get; set; }

        [ForeignKey("EscolaId")]
        public Escola Escola { get; set; }

        [ForeignKey("ProfessorId")]
        public Professor Professor { get; set; }

    }
}
