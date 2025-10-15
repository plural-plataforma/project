using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace api.Models
{
    [Table("habilidadesxplanejamento")]
    public class HabilidadesXPlanejamento
    {
        [Key, Column("habilidadeid", Order = 0)]
        public int HabilidadeId { get; set; }

        [Key, Column("planejamentoid", Order = 1)]
        public int PlanejamentoId { get; set; }

        [ForeignKey("HabilidadeId")]
        public Habilidade Habilidade { get; set; }

        [ForeignKey("PlanejamentoId")]
        public Planejamento Planejamento { get; set; }

    }
}