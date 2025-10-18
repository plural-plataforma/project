using System.ComponentModel.DataAnnotations;

namespace api.DTOs.Aluno
{
    public class AlunoAtualizarDTO
    {
        [Required]
        public int Id { get; set; }

        [MaxLength(256)]
        public string? NomeCompleto { get; set; }

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

        [MaxLength(20)]
        public string? Telefone { get; set; }

        public int? IdEscola { get; set; }

        [MaxLength(20)]
        public string? NivelEnsino { get; set; }

        [MaxLength(45)]
        public string? Ano { get; set; }

        [MaxLength(10)]
        public string? Turno { get; set; }

        [MaxLength(1)]
        public string? Sexo { get; set; }
    }
}
