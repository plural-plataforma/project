using api.DTOs.Webhooks;
using api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class WebhooksController : ControllerBase
    {
        private readonly HotmartWebhookService _hotmartService;
        private readonly ILogger<WebhooksController> _logger;
        private readonly string _expectedHottok;

        public WebhooksController(
            HotmartWebhookService hotmartService,
            ILogger<WebhooksController> logger,
            IConfiguration configuration)
        {
            _hotmartService = hotmartService;
            _logger = logger;
            _expectedHottok = configuration["Hotmart:Hottok"]
                ?? throw new InvalidOperationException("Hotmart:Hottok não configurado no appsettings");

            _logger.LogInformation("Hottok carregado no startup: {HottokLength} caracteres (primeiros 10: {Preview})",
        _expectedHottok.Length,
        _expectedHottok.Length > 10 ? _expectedHottok.Substring(0, 10) + "..." : _expectedHottok);
        }

        [HttpPost("hotmart")]
        [AllowAnonymous]
        public async Task<IActionResult> HotmartWebhook([FromBody] HotmartWebhookV2Dto? payload)
        {
            if (payload == null)
            {
                _logger.LogWarning("Payload nulo recebido no webhook Hotmart");
                return BadRequest("Payload inválido");
            }

            // Log para depuração imediata
            _logger.LogInformation("Webhook recebido - Evento: {Event} | Version: {Version} | Hottok presente: {HasHottok}",
                payload.Event, payload.Version, !string.IsNullOrEmpty(payload.Hottok));

            // Validação de hottok (já está correta)
            if (string.IsNullOrWhiteSpace(payload.Hottok) || payload.Hottok != _expectedHottok)
            {
                _logger.LogWarning("hottok inválido: recebido '{Received}' | esperado '{Expected}'",
                    payload.Hottok, _expectedHottok);
                return Unauthorized("Token de autenticação inválido");
            }

            var success = await _hotmartService.ProcessPurchaseWebhookAsync(payload);

            return Ok(new
            {
                received = true,
                processed = success,
                eventType = payload.Event
            });
        }
    }
}