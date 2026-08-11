namespace api.DTOs.PromptSistemaIA
{
    public class PromptSistemaIABuscarDTO
    {
        public int Id { get; set; }
        public string TipoDocumento { get; set; } = string.Empty;
        public string Conteudo { get; set; } = string.Empty;
        public DateTime UpdatedAt { get; set; }
    }
}
