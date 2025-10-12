using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace api.Models
{ 
 [Table("professores")]
 public class Professor
 {
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int ID { get; set; }

    [MaxLength(256)]
    public string NomeCompleto { get; set; }

    [MaxLength(9)]
    public string? Cep { get; set; }

    [MaxLength(50)]
    public string? Logradouro { get; set; }

    public int? Numero { get; set; }

    [MaxLength(100)]
    public string? Complemento { get; set; }

    [MaxLength(50)]
    public string? Bairro { get; set; }

    [MaxLength(40)]
    public string? Estado { get; set; }

    [MaxLength(40)]
    public string? Cidade { get; set; }

    public string? Telefone { get; set; }

    [MaxLength(500)]
    public string? Disciplinas { get; set; }

    [MaxLength(20)]
    public string? NivelEnsino { get; set; }

    [MaxLength(500)]
    public string? Sobre { get; set; }

    public byte[]? Foto { get; set; }

    [MaxLength(1)]
    public string? Sexo { get; set; }

    public ICollection<Escola>? Escolas { get; set; }

    }
}
