using api.DTOs.Atividade;

namespace api.DTOs.Bloco
{
    public class BlocoComAtividadesDTO
    {
        public int Id { get; set; }
        public string Titulo { get; set; } = string.Empty;
        public int Ordem { get; set; }
        public string? Observacao { get; set; }
        public string? Icone { get; set; }
        public int QuantidadeAtividades { get; set; }
        public List<AtividadeBuscarDTO> Atividades { get; set; } = new List<AtividadeBuscarDTO>();
    }
}
