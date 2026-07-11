using System.ComponentModel.DataAnnotations;

namespace api.DTOs.ConfiguracaoSite
{
    public class LinksWhatsAppDTO
    {
        [Required(ErrorMessage = "O link do grupo do WhatsApp da Morgana é obrigatório")]
        [Url(ErrorMessage = "Informe uma URL válida para o link da Morgana")]
        public string MorganaWhatsappUrl { get; set; } = string.Empty;

        [Required(ErrorMessage = "O link do grupo do WhatsApp da Plural é obrigatório")]
        [Url(ErrorMessage = "Informe uma URL válida para o link da Plural")]
        public string PluralWhatsappUrl { get; set; } = string.Empty;
    }
}
