using System.ComponentModel.DataAnnotations;

namespace api.DTOs.Avaliacao
{
    public class AvaliacaoCadastroDTO
    {
        [Required]
        public int Id { get; set; }

        [Required]
        public string Descricao { get; set; }

        [Required]
        public string Resumo { get; set; }

    } 
}