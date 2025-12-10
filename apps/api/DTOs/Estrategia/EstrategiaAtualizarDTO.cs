using System.ComponentModel.DataAnnotations;

namespace api.DTOs.Estrategia
{
    public class EstrategiaAtualizarDTO
    {
        [Required] 
        public int Id { get; set; }

        public string Descricao { get; set; }

        public bool? Ativo { get; set; }
    }
}