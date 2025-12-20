namespace api.Models;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

[Table("avaliacao")]
    public class Avaliacao
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        public string Descricao { get; set; }

        public string Resumo { get; set; }

        public bool Ativo { get; set; }

        public ICollection<AvaliacaoXPlanejamento> AvaliacaoXPlanejamento { get; set; }
    }

