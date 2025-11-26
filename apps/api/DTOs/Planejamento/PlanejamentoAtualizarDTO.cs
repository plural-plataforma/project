using System.ComponentModel.DataAnnotations;

namespace api.DTOs.Planejamento
{
    public class PlanejamentoAtualizarDTO
    {
        [Required]
        public int Id { get; set; }

        public string? Apelido { get; set; }

        public DateOnly? DataInicio { get; set; }

        public DateOnly? DataFim { get; set; }

        public string? DescicaoPlanejamento { get; set; }
    }
}
