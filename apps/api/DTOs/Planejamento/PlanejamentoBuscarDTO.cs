using api.DTOs.Aluno;
using api.DTOs.Avaliacao;
using api.DTOs.Estrategia;
using api.DTOs.Habilidade;

namespace api.DTOs.Planejamento
{
    public class PlanejamentoBuscarDTO
    {
        public int Id { get; set; }

        public string Apelido { get; set; }

        public DateOnly DataInicio { get; set; }

        public DateOnly DataFim { get; set; }

        public string DescicaoPlanejamento { get; set; }

        public List<HabilidadeBuscarDTO> Habilidades { get; set; } = new();
        public List<AlunoResumoDTO> Alunos { get; set; } = new();
        public List<EstrategiaBuscarDTO> Estrategias { get; set; } = new();
        public List<AvaliacaoBuscarDTO> Avaliacao { get; set; } = new();

        public string? ObjetivoCurtoPrazo { get; set; }

        public string? ObjetivoMedioPrazo { get; set; }

        public string? ObjetivoLongoPrazo { get; set; }

        public bool DocumentoDeclaradoAssinado { get; set; }

        public string? AssinaturaNomeResponsavel { get; set; }

        public string? AssinaturaCargo { get; set; }

        public List<PaeeEncontroBuscarDTO> Encontros { get; set; } = [];
    }
}