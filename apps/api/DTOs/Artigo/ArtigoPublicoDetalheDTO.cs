namespace api.DTOs.Artigo
{
    // Página do artigo na LP — inclui Conteudo em Markdown pra renderização final.
    public class ArtigoPublicoDetalheDTO
    {
        public string Slug { get; set; } = string.Empty;
        public string Titulo { get; set; } = string.Empty;
        public string Resumo { get; set; } = string.Empty;
        public string Conteudo { get; set; } = string.Empty;
        public string? Categoria { get; set; }
        public string Autor { get; set; } = string.Empty;
        public int TempoLeituraMinutos { get; set; }
        public string? ImagemCapaUrl { get; set; }
        public DateTime PublicadoEm { get; set; }
    }
}
