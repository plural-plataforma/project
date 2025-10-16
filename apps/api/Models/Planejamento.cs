namespace api.Models;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

[Table("planejamentos")]
public class Planejamento
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int ID { get; set; }

    public string Apelido { get; set; }

    public DateOnly DataInicio { get; set; }

    public DateOnly DataFim { get; set; }
    public int IdProfessor { get; set; }

    [ForeignKey("IdProfessor")]
    public Professor Professor { get; set; }


    public ICollection<HabilidadesXPlanejamento> HabilidadesXPlanejamentos { get; set; }
    public ICollection<AlunosXPlanejamento> AlunosXPlanejamentos { get; set; }

}