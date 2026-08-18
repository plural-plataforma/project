using System.ComponentModel.DataAnnotations;

namespace api.DTOs.Artigo
{
    public class ArtigoAtualizarDTO
    {
        [MaxLength(200)]
        public string? Titulo { get; set; }

        [MaxLength(220)]
        public string? Slug { get; set; }

        [MaxLength(400)]
        public string? Resumo { get; set; }

        public string? Conteudo { get; set; }

        [MaxLength(100)]
        public string? Categoria { get; set; }

        [MaxLength(150)]
        public string? Autor { get; set; }

        [Range(1, 120)]
        public int? TempoLeituraMinutos { get; set; }

        [MaxLength(500)]
        public string? ImagemCapaUrl { get; set; }

        public bool? Publicado { get; set; }

        public bool? Ativo { get; set; }
    }
}
