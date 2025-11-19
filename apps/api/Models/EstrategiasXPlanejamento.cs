using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace api.Models
{

    [Table("estrategiasxplanejamento")]
    public class EstrategiasXPlanejamento
    {

        [Key, Column("estrategiaid", Order = 0)]
        public int EstrategiaId { get; set; }

        [Key, Column("planejamentoid", Order = 1)]
        public int PlanejamentoId { get; set; }

        [ForeignKey("EstrategiaId")]
        public Habilidade Estrategia { get; set; }

        [ForeignKey("PlanejamentoId")]
        public Planejamento Planejamento { get; set; }
    }
}
