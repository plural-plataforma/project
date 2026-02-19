namespace api.Models;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

[Table("habilidades")]
public class Habilidade
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    public int IdNivelEnsino { get; set; }
    public string Tipo { get; set; }

    public string Descricao { get; set; }

    public string? Resumo { get; set; }

    public bool Ativo { get; set; }
    public ICollection<HabilidadesXPlanejamento> HabilidadesXPlanejamentos { get; set; }

    public ICollection<Atividade> Atividades { get; set; }

}