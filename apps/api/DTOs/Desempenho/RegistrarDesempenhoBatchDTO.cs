namespace api.DTOs.Desempenho
{
    public class RegistrarDesempenhoBatchDTO
    {
        public int AvaliacaoDiagnosticaId { get; set; }
        public List<RegistrarDesempenhoItemDTO> Itens { get; set; } = new List<RegistrarDesempenhoItemDTO>();
    }
}
