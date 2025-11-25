namespace api.Models;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

[Table("estrategias")]
    public class Estrategias
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        public string Descricao { get; set; }

        public bool Ativo { get; set; }

        public ICollection<EstrategiasXPlanejamento> EstrategiasXPlanejamentos { get; set; }
    }
