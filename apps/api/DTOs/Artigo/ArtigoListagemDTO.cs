namespace api.DTOs.Artigo
{
    // Metadados apenas — sem o Conteudo (evita payload pesado na listagem do admin).
    public class ArtigoListagemDTO
    {
        public int Id { get; set; }
        public string Titulo { get; set; } = string.Empty;
        public string Slug { get; set; } = string.Empty;
        public string? Categoria { get; set; }
        public string Autor { get; set; } = string.Empty;
        public string? ImagemCapaUrl { get; set; }
        public bool Publicado { get; set; }
        public DateTime? PublicadoEm { get; set; }
        public bool Ativo { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}
