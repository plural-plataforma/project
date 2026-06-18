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

        public string? ObjetivoCurtoPrazo { get; set; }

        public string? ObjetivoMedioPrazo { get; set; }

        public string? ObjetivoLongoPrazo { get; set; }

        public int? ObjetivoCurtoCatalogoId { get; set; }

        public int? ObjetivoMedioCatalogoId { get; set; }

        public int? ObjetivoLongoCatalogoId { get; set; }

        public bool? DocumentoDeclaradoAssinado { get; set; }

        public string? AssinaturaNomeResponsavel { get; set; }

        public string? AssinaturaCargo { get; set; }
    }
}
