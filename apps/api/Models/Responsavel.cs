using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace api.Models
{
    [Table("responsaveis")]
    public class Responsavel
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Required]
        [StringLength(100)]
        public string NomeCompleto { get; set; }

        [StringLength(9)]
        public string Cep { get; set; }

        [StringLength(50)]
        public string Logradouro { get; set; }

        public int Numero { get; set; }

        [StringLength(100)]
        public string Complemento { get; set; }

        [StringLength(50)]
        public string Bairro { get; set; }

        [StringLength(40)]
        public string Estado { get; set; }

        [StringLength(40)]
        public string Cidade { get; set; }
        
        [StringLength(20)]
        public string Telefone { get; set; }
    }
}
