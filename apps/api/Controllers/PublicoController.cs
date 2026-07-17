using api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Mvc;

namespace api.Controllers
{
    /// <summary>
    /// Endpoints públicos, sem autenticação, consumidos pelas landing pages
    /// (morgana-lp, plural-lp) para exibir dados que o admin mantém atualizados.
    /// </summary>
    [AllowAnonymous]
    [EnableCors("AllowPublicSites")]
    [ApiController]
    [Route("api/publico")]
    public class PublicoController : ControllerBase
    {
        private readonly ConfiguracaoSiteService _configuracaoSiteService;

        public PublicoController(ConfiguracaoSiteService configuracaoSiteService)
        {
            _configuracaoSiteService = configuracaoSiteService;
        }

        /// <summary>
        /// Retorna os links dos grupos de WhatsApp das landing pages (Morgana e Plural)
        /// para uso público nas próprias LPs.
        /// </summary>
        [HttpGet("configuracoes/whatsapp")]
        public async Task<IActionResult> GetLinksWhatsApp()
        {
            var resposta = await _configuracaoSiteService.GetLinksWhatsAppAsync();
            return resposta.Sucesso ? Ok(resposta.Objeto) : BadRequest(resposta);
        }

        /// <summary>
        /// Retorna os links de venda (checkout Hotmart) mensal e anual da Plural
        /// para uso público na própria LP.
        /// </summary>
        [HttpGet("configuracoes/checkout")]
        public async Task<IActionResult> GetLinkCheckout()
        {
            var resposta = await _configuracaoSiteService.GetLinkCheckoutAsync();
            return resposta.Sucesso ? Ok(resposta.Objeto) : BadRequest(resposta);
        }
    }
}
