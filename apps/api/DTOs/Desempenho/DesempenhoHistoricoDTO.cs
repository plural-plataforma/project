namespace api.DTOs.Desempenho
{
    public class DesempenhoHistoricoItemDTO
    {
        public int Id { get; set; }
        public int AvaliacaoDiagnosticaId { get; set; }
        public int AlunoId { get; set; }
        public int AtividadeId { get; set; }
        public string NivelRealizacao { get; set; } = "NaoAvaliado";
        public string? Observacao { get; set; }
        public DateTime DataRegistro { get; set; }
    }

    public class ObservacaoAlunoHistoricoItemDTO
    {
        public int Id { get; set; }
        public int AvaliacaoDiagnosticaId { get; set; }
        public int AlunoId { get; set; }
        public string Observacao { get; set; } = string.Empty;
        public DateTime DataRegistro { get; set; }
    }

    public class DesempenhoHistoricoResponseDTO
    {
        public List<DesempenhoHistoricoItemDTO> Itens { get; set; } = new();
        public List<ObservacaoAlunoHistoricoItemDTO> ObservacoesAlunos { get; set; } = new();
    }
}
