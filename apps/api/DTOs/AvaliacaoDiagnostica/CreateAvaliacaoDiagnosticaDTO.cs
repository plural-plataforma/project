namespace api.DTOs.AvaliacaoDiagnostica
{
    public class CreateAvaliacaoDiagnosticaDTO
    {
        public string Titulo { get; set; } = string.Empty;
        public string? Objetivo { get; set; }
        public DateTime? DataAplicacao { get; set; }   // opcional, se não vier usa hoje
        public int EscolaId { get; set; }
        public List<int> AlunoIds { get; set; } = new List<int>();
        public List<int> BlocoIds { get; set; } = new List<int>();
    }
}
