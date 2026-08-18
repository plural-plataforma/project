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
        private readonly ArtigoService _artigoService;

        public PublicoController(ConfiguracaoSiteService configuracaoSiteService, ArtigoService artigoService)
        {
            _configuracaoSiteService = configuracaoSiteService;
            _artigoService = artigoService;
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

        /// <summary>
        /// Lista os artigos publicados (blog) para exibição na LP.
        /// </summary>
        [HttpGet("artigos")]
        public async Task<IActionResult> GetArtigos([FromQuery] string? categoria)
        {
            var resposta = await _artigoService.GetPublicados(categoria);
            return resposta.Sucesso ? Ok(resposta.Objeto) : BadRequest(resposta);
        }

        /// <summary>
        /// Retorna um artigo publicado pelo slug, com o conteúdo completo em Markdown.
        /// </summary>
        [HttpGet("artigos/{slug}")]
        public async Task<IActionResult> GetArtigoPorSlug(string slug)
        {
            var resposta = await _artigoService.GetPublicadoPorSlug(slug);
            return resposta.Sucesso ? Ok(resposta.Objeto) : NotFound(resposta);
        }
    }
}
