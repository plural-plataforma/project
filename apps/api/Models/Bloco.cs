using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace api.Models;
    
    [Table("bloco")]
    public class Bloco
    {
    [Key]
    public int Id { get; set; } // ID primário

    [Required]
    [StringLength(100)]
    public string Titulo { get; set; } // Título

    public int Ordem { get; set; } // Ordem (ex.: para ordenação)

    [StringLength(500)]
    public string Observacao { get; set; } // Observação

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow; // Data de criação

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow; // Data de atualização

    public bool Status { get; set; } = true; // Status (true = ativo, false = inativo)

    [StringLength(50)]
    public string Icone { get; set; } // Ícone (ex.: nome de arquivo ou classe CSS)

    // Campo virtual para quantidade de atividades (assumindo relação com Atividade)
    public virtual ICollection<Atividade> Atividades { get; set; } // Relação 1:N com Atividade (crie o model Atividade se não existir)

    // Propriedade computada (virtual ou via query)
    public int QuantidadeAtividades => Atividades?.Count ?? 0; // Conta atividades relacionadas (virtual, não armazenado no BD)
}

