using api.DTOs.Admin;
using api.DTOs.ConfiguracaoSite;
using api.Responses;
using api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace api.Controllers
{
    [Authorize(Roles = "Admin")] // descomente quando roles estiverem funcionando
    [ApiController]
    [Route("api/admin")]
    public class AdminController : ControllerBase
    {
        private readonly AdminService _adminService;
        private readonly AvaliacaoDiagnosticaService _avaliacaoDiagnosticaService;
        private readonly ConfiguracaoSiteService _configuracaoSiteService;

        public AdminController(
            AdminService adminService,
            AvaliacaoDiagnosticaService avaliacaoDiagnosticaService,
            ConfiguracaoSiteService configuracaoSiteService)
        {
            _adminService = adminService;
            _avaliacaoDiagnosticaService = avaliacaoDiagnosticaService;
            _configuracaoSiteService = configuracaoSiteService;
        }

        [HttpPatch("usuarios/atualizar")]
        public async Task<IActionResult> AtualizarUsuario([FromBody] AtualizarStatusUsuarioDTO dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var resposta = await _adminService.AtualizarUsuarioAsync(dto);

            if (resposta.Sucesso)
            {
                return Ok(resposta);
            }

            return BadRequest(resposta);
        }

        [HttpGet("usuarios/listar")]
        public async Task<IActionResult> ListarParaAdmin(
            [FromQuery] int pagina = 1,
            [FromQuery] int tamanhoPagina = 50,
            [FromQuery] bool? ativo = null,
            [FromQuery] bool? isEmbaixadora = null,
            [FromQuery] string? search = null,
            [FromQuery] string? nivelEnsino = null)
        {
            var resposta = await _adminService.ListarTodosParaAdminAsync(
                pagina: pagina,
                tamanhoPagina: tamanhoPagina,
                ativo: ativo,
                isEmbaixadora: isEmbaixadora,
                search: search,
                nivelEnsino: nivelEnsino
            );

            if (resposta.Sucesso)
            {
                return Ok(resposta.Objeto); // Retorna o PaginatedResult<ProfessorAdminListDTO>
            }

            // Em caso de erro, retorna 500 com a mensagem do serviço
            return StatusCode(500, new
            {
                erro = "Falha ao listar professores",
                detalhe = resposta.Mensagens.FirstOrDefault() ?? "Erro interno"
            });
        }

        /// <summary>
        /// Resumo agregado de uso pedagógico (avaliações diagnósticas, desempenhos e
        /// diagnósticos finais) sem filtro por professor — usado pelo Dashboard do Admin.
        /// </summary>
        [HttpGet("dashboard/resumo-pedagogico")]
        public async Task<IActionResult> ResumoPedagogico([FromQuery] DateTime? from, [FromQuery] DateTime? to)
        {
            var resposta = await _avaliacaoDiagnosticaService.GetResumoPedagogicoAsync(from, to);
            return resposta.Sucesso ? Ok(resposta) : BadRequest(resposta);
        }

        /// <summary>
        /// Retorna os links dos grupos de WhatsApp das landing pages (Morgana e Plural)
        /// atualmente cadastrados, para exibição na tela de Configurações do admin.
        /// </summary>
        [HttpGet("configuracoes/whatsapp")]
        public async Task<IActionResult> GetLinksWhatsApp()
        {
            var resposta = await _configuracaoSiteService.GetLinksWhatsAppAsync();
            return resposta.Sucesso ? Ok(resposta) : BadRequest(resposta);
        }

        /// <summary>
        /// Atualiza os links dos grupos de WhatsApp das landing pages (Morgana e Plural).
        /// </summary>
        [HttpPatch("configuracoes/whatsapp")]
        public async Task<IActionResult> AtualizarLinksWhatsApp([FromBody] LinksWhatsAppDTO dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var atualizadoPor = User?.Identity?.Name;
            var resposta = await _configuracaoSiteService.AtualizarLinksWhatsAppAsync(dto, atualizadoPor);

            return resposta.Sucesso ? Ok(resposta) : BadRequest(resposta);
        }

        /// <summary>
        /// Retorna os links de venda (checkout Hotmart) mensal e anual da Plural
        /// atualmente cadastrados, para exibição na tela de Configurações do admin.
        /// </summary>
        [HttpGet("configuracoes/checkout")]
        public async Task<IActionResult> GetLinkCheckout()
        {
            var resposta = await _configuracaoSiteService.GetLinkCheckoutAsync();
            return resposta.Sucesso ? Ok(resposta) : BadRequest(resposta);
        }

        /// <summary>
        /// Atualiza os links de venda (checkout Hotmart) mensal e anual da Plural.
        /// </summary>
        [HttpPatch("configuracoes/checkout")]
        public async Task<IActionResult> AtualizarLinkCheckout([FromBody] LinkCheckoutDTO dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var atualizadoPor = User?.Identity?.Name;
            var resposta = await _configuracaoSiteService.AtualizarLinkCheckoutAsync(dto, atualizadoPor);

            return resposta.Sucesso ? Ok(resposta) : BadRequest(resposta);
        }
    }
}