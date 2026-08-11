using System.ComponentModel.DataAnnotations;

namespace api.DTOs.PromptSistemaIA
{
    public class PromptSistemaIAAtualizarDTO
    {
        [Required]
        public string Conteudo { get; set; } = string.Empty;
    }
}
