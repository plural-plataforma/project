using System.ComponentModel.DataAnnotations;

namespace api.DTOs.Avaliacao
{
    public class AvaliacaoAtualizarDTO
    {
        [Required] 
        public int Id { get; set; }

        public string Descricao { get; set; }

        public string Resumo { get; set; }

        public bool? Ativo { get; set; }
    }
}