using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace api.DTOs.Responsavel
{
    public class ResponsavelCadastroDTO
    {
        [Required]
        [StringLength(100)]
        public string NomeCompleto { get; set; }

        [StringLength(9)]
        public string? Cep { get; set; }

        [StringLength(50)]
        public string? Logradouro { get; set; }

        public int? Numero { get; set; }

        [StringLength(100)]
        public string? Complemento { get; set; }

        [StringLength(50)]
        public string? Bairro { get; set; }

        [StringLength(40)]
        public string? Estado { get; set; }

        [StringLength(40)]
        public string? Cidade { get; set; }

        [StringLength(20)]
        public string Telefone { get; set; }

        [StringLength(256)]
        public string Email { get; set; }

    }
}