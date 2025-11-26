using System.ComponentModel.DataAnnotations;

namespace api.DTOs.Estrategia
{
    public class EstrategiaCadastroDTO
    {
        [Required]
        public int Id { get; set; }

        [Required]
        public string Descricao { get; set; }

    } 
}