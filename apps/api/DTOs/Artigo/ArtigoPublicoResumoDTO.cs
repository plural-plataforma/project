namespace api.DTOs.Artigo
{
    // Listagem pública consumida pela LP — sem Conteudo (payload leve pro índice do blog).
    public class ArtigoPublicoResumoDTO
    {
        public string Slug { get; set; } = string.Empty;
        public string Titulo { get; set; } = string.Empty;
        public string Resumo { get; set; } = string.Empty;
        public string? Categoria { get; set; }
        public string Autor { get; set; } = string.Empty;
        public int TempoLeituraMinutos { get; set; }
        public string? ImagemCapaUrl { get; set; }
        public DateTime PublicadoEm { get; set; }
    }
}
