using api.DTOs.Escola;
using api.Models;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace api.DTOs.Aluno
{
    public class AlunoDTO
    {
        [StringLength(256)]
        public string? NomeCompleto { get; set; }

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

        public int? Telefone { get; set; }

        public int? IdResponsavel { get; set; }
        public int? IdEscola { get; set; }

        [StringLength(20)]
        public string? NivelEnsino { get; set; }

        [StringLength(45)]
        public string? Ano { get; set; }

        [StringLength(10)]
        public string? Turno { get; set; }

    }

    public class AlunoComId : AlunoDTO{
        [Required]
        public int Id { get; set; }
    }
}
