using System.Text;
using System.Text.Json;

namespace api.Services
{
    /// <summary>
    /// Dispara eventos de negócio para o webhook externo de automações (onboarding).
    /// Best-effort: falha aqui nunca deve impactar o fluxo que a chamou (ex.: cadastro).
    /// </summary>
    public class OnboardingWebhookService
    {
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _config;
        private readonly ILogger<OnboardingWebhookService> _logger;

        public OnboardingWebhookService(HttpClient httpClient, IConfiguration config, ILogger<OnboardingWebhookService> logger)
        {
            _httpClient = httpClient;
            _config = config;
            _logger = logger;
            _httpClient.Timeout = TimeSpan.FromSeconds(10);
        }

        public async Task DispararCadastroAsync(string nomeCompleto, string email, string? telefone, string origem)
        {
            var url = _config["ONBOARDING_WEBHOOK_URL"];
            if (string.IsNullOrWhiteSpace(url))
            {
                _logger.LogWarning("ONBOARDING_WEBHOOK_URL não configurada — webhook de onboarding não disparado (email: {Email})", email);
                return;
            }

            try
            {
                var payload = new
                {
                    evento = "cadastro",
                    nomeCompleto,
                    email,
                    telefone,
                    origem,
                    dataCadastro = DateTime.UtcNow,
                };

                if (string.IsNullOrWhiteSpace(telefone))
                {
                    _logger.LogWarning(
                        "Webhook de onboarding disparado sem telefone para {Email} (origem: {Origem})",
                        email, origem);
                }

                var json = JsonSerializer.Serialize(payload);
                using var content = new StringContent(json, Encoding.UTF8, "application/json");

                var response = await _httpClient.PostAsync(url, content);

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogWarning(
                        "Webhook de onboarding respondeu {StatusCode} para {Email} (origem: {Origem})",
                        response.StatusCode, email, origem);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Falha ao disparar webhook de onboarding para {Email} (origem: {Origem})", email, origem);
            }
        }
    }
}
