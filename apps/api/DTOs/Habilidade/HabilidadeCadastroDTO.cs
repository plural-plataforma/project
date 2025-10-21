using System.ComponentModel.DataAnnotations;

namespace api.DTOs
{
    public class HabilidadeCadastroDTO
    {
        [Required]
        public int Id { get; set; }

        [Required]
        public int IdNivelEnsino { get; set; }

        [Required]
        public string Tipo { get; set; }

        [Required]
        public string Descricao { get; set; }

        public string? Resumo { get; set; }


    } 
}