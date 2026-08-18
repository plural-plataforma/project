namespace api.DTOs.Artigo
{
    // Usado pelo admin ao abrir um artigo pra edição — inclui o Conteudo completo.
    public class ArtigoDetalheDTO
    {
        public int Id { get; set; }
        public string Titulo { get; set; } = string.Empty;
        public string Slug { get; set; } = string.Empty;
        public string Resumo { get; set; } = string.Empty;
        public string Conteudo { get; set; } = string.Empty;
        public string? Categoria { get; set; }
        public string Autor { get; set; } = string.Empty;
        public int TempoLeituraMinutos { get; set; }
        public string? ImagemCapaUrl { get; set; }
        public bool Publicado { get; set; }
        public DateTime? PublicadoEm { get; set; }
        public bool Ativo { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}
