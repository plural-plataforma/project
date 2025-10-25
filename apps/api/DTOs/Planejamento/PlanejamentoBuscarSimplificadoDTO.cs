using api.DTOs.Aluno;
using api.DTOs.Habilidade;

namespace api.DTOs.Planejamento
{
    public class PlanejamentoBuscarSimplificadoDTO
    {
        public int Id { get; set; }

        public string Apelido { get; set; }

        public DateOnly DataInicio { get; set; }

        public DateOnly DataFim { get; set; }

        public List<HabilidadeBuscarDTO> Habilidades { get; set; } = new();

    }
}