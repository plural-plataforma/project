using System.ComponentModel.DataAnnotations;

namespace api.DTOs.ConfiguracaoSite
{
    public class LinkCheckoutDTO
    {
        [Required(ErrorMessage = "O link de venda mensal da Hotmart é obrigatório")]
        [RegularExpression(
            @"^https:\/\/([a-zA-Z0-9-]+\.)*hotmart\.com(\/.*)?$",
            ErrorMessage = "Informe uma URL válida da Hotmart (ex.: https://pay.hotmart.com/...)")]
        public string PluralCheckoutUrlMensal { get; set; } = string.Empty;

        [Required(ErrorMessage = "O link de venda anual da Hotmart é obrigatório")]
        [RegularExpression(
            @"^https:\/\/([a-zA-Z0-9-]+\.)*hotmart\.com(\/.*)?$",
            ErrorMessage = "Informe uma URL válida da Hotmart (ex.: https://pay.hotmart.com/...)")]
        public string PluralCheckoutUrlAnual { get; set; } = string.Empty;

        /// <summary>
        /// Link de checkout mensal com parâmetro de afiliado Hotmart, usado na
        /// página de tráfego pago. Opcional — fica vazio até a cliente configurar.
        /// </summary>
        [RegularExpression(
            @"^(https:\/\/([a-zA-Z0-9-]+\.)*hotmart\.com(\/.*)?)?$",
            ErrorMessage = "Informe uma URL válida da Hotmart (ex.: https://pay.hotmart.com/...)")]
        public string PluralCheckoutUrlMensalAfiliado { get; set; } = string.Empty;

        /// <summary>
        /// Link de checkout anual com parâmetro de afiliado Hotmart, usado na
        /// página de tráfego pago. Opcional — fica vazio até a cliente configurar.
        /// </summary>
        [RegularExpression(
            @"^(https:\/\/([a-zA-Z0-9-]+\.)*hotmart\.com(\/.*)?)?$",
            ErrorMessage = "Informe uma URL válida da Hotmart (ex.: https://pay.hotmart.com/...)")]
        public string PluralCheckoutUrlAnualAfiliado { get; set; } = string.Empty;
    }
}
