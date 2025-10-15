using api.Models;
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

    public DateTime DataInicio { get; set; }

    public DateTime DataFim { get; set; }

    public ICollection<HabilidadesXPlanejamento> HabilidadesXPlanejamentos { get; set; }
    public ICollection<AlunosXPlanejamento> AlunosXPlanejamentos { get; set; }

}