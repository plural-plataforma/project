namespace api.DTOs.Atividade
{
    public class AtividadeBuscarDTO
    {
        public int Id { get; set; }
        public string Titulo { get; set; } = string.Empty;
        public string Enunciado { get; set; } = string.Empty;
        public int BlocoId { get; set; }
        public string Nivel { get; set; } = string.Empty; // "Facil", etc.
        public string EtapaMin { get; set; } = string.Empty;
        public string? EtapaMax { get; set; }
        public string? ImagemUrl { get; set; }
        public bool Ativo { get; set; }
        public List<int> HabilidadeIds { get; set; } = new List<int>(); // IDs das habilidades associadas
    }
}
