namespace api.DTOs.Atividade
{
    public class AtividadesPaginadasDTO
    {
        public List<AtividadeBuscarDTO> Itens { get; set; } = new();
        public int Total { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
    }
}
