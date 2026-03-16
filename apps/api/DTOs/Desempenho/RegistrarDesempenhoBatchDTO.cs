namespace api.DTOs.Desempenho
{
    public class RegistrarObservacaoAlunoDTO
    {
        public int AlunoId { get; set; }
        public string? Observacao { get; set; }
    }

    public class RegistrarDesempenhoBatchDTO
    {
        public int AvaliacaoDiagnosticaId { get; set; }
        public List<RegistrarDesempenhoItemDTO> Itens { get; set; } = new List<RegistrarDesempenhoItemDTO>();
        public List<RegistrarObservacaoAlunoDTO> ObservacoesAlunos { get; set; } = new List<RegistrarObservacaoAlunoDTO>();
    }
}
