using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace api.Models
{
    public enum NivelAtividade
    {
        Facil,
        Medio,
        Dificil
    }
    [Table("atividade")]
    public class Atividade
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [StringLength(100)]
        public string Titulo { get; set; } = string.Empty;

        [Column(TypeName = "text")]
        public string Enunciado { get; set; } = string.Empty;

        [ForeignKey("bloco")]
        public int BlocoId { get; set; }
        public virtual Bloco Bloco { get; set; } = null!;

        public NivelAtividade Nivel { get; set; }

        [Required]
        [StringLength(10)]
        public string EtapaMin { get; set; } = string.Empty; // ex.: "EI", "EF1", "EF2"

        [StringLength(10)]
        public string? EtapaMax { get; set; }

        [StringLength(500)]
        public string? ImagemUrl { get; set; }

        public bool Ativo { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Relacionamento belongsToMany com Habilidade (pivot automatica via EF)
        public virtual ICollection<Habilidade> Habilidades { get; set; } = new List<Habilidade>();
    }
}