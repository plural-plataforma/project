using api.Models;
using System.ComponentModel.DataAnnotations;

namespace api.DTOs.Aluno
{
    public class HabilidadeDTO
    {
        public string? NivelEnsino { get; set; }

        public string? Tipo { get; set; }

        public string? Descricao { get; set; }

        public string? Resumo { get; set; }


    }

    public class HabilidadeCompletoDTO : HabilidadeDTO
    {
        [Required]
        public int ID { get; set; }

        public bool? Ativo { get; set; }

    }
}