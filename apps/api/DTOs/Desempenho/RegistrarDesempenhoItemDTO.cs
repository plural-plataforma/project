namespace api.DTOs.Desempenho
{
    public class RegistrarDesempenhoItemDTO
    {
        public int AlunoId { get; set; }
        public int AtividadeId { get; set; }
        public string NivelRealizacao { get; set; } = "NaoAvaliado"; // Autonomia, ComAjuda, NaoRealizou, NaoAvaliado
        public string? Observacao { get; set; }
    }
}
