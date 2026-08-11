using System.Text.Json;
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
        private static readonly JsonSerializerOptions JsonOpts = new() { PropertyNameCaseInsensitive = true };

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

        // Aceita JsonElement bruto: o evento SUBSCRIPTION_CANCELLATION tem um formato de "data"
        // diferente dos eventos de compra (PURCHASE_APPROVED etc), então o "event" precisa ser lido
        // antes de decidir em qual DTO tipado desserializar.
        [HttpPost("hotmart")]
        [AllowAnonymous]
        public async Task<IActionResult> HotmartWebhook([FromBody] JsonElement payload)
        {
            if (payload.ValueKind != JsonValueKind.Object)
            {
                _logger.LogWarning("Payload inválido recebido no webhook Hotmart");
                return BadRequest("Payload inválido");
            }

            var eventName = payload.TryGetProperty("event", out var eventEl) ? eventEl.GetString() : null;
            var hottok = payload.TryGetProperty("hottok", out var hottokEl) ? hottokEl.GetString() : null;

            _logger.LogInformation("Webhook recebido - Evento: {Event} | Hottok presente: {HasHottok}",
                eventName, !string.IsNullOrEmpty(hottok));

            if (string.IsNullOrWhiteSpace(hottok) || hottok != _expectedHottok)
            {
                _logger.LogWarning("hottok inválido: recebido '{Received}' | esperado '{Expected}'", hottok, _expectedHottok);
                return Unauthorized("Token de autenticação inválido");
            }

            bool success;
            switch (eventName)
            {
                case "SUBSCRIPTION_CANCELLATION":
                    var cancelDto = payload.Deserialize<HotmartSubscriptionCancellationWebhookDto>(JsonOpts);
                    success = cancelDto == null || await _hotmartService.ProcessCancellationWebhookAsync(cancelDto);
                    break;
                case "UPDATE_SUBSCRIPTION_CHARGE_DATE":
                    var chargeDateDto = payload.Deserialize<HotmartChargeDateUpdateWebhookDto>(JsonOpts);
                    success = chargeDateDto == null || await _hotmartService.ProcessChargeDateUpdateWebhookAsync(chargeDateDto);
                    break;
                default:
                    var purchaseDto = payload.Deserialize<HotmartWebhookV2Dto>(JsonOpts);
                    success = purchaseDto == null || await _hotmartService.ProcessPurchaseWebhookAsync(purchaseDto);
                    break;
            }

            return Ok(new
            {
                received = true,
                processed = success,
                eventType = eventName
            });
        }
    }
}
