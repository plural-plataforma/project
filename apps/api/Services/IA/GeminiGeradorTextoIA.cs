using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Configuration;

namespace api.Services.IA
{
    public class GeminiGeradorTextoIA : IGeradorTextoIA
    {
        private readonly HttpClient _httpClient;
        private readonly string _apiKey;
        private readonly string _model;

        public GeminiGeradorTextoIA(HttpClient httpClient, IConfiguration configuration)
        {
            _httpClient = httpClient;
            _apiKey = configuration["Gemini:ApiKey"]
                ?? throw new InvalidOperationException("Gemini:ApiKey não configurada em appsettings.");
            _model = configuration["Gemini:Model"] ?? "gemini-2.0-flash";
        }

        public async Task<string> GerarTextoAsync(string systemPrompt, string prompt)
        {
            var url = $"https://generativelanguage.googleapis.com/v1beta/models/{_model}:generateContent?key={_apiKey}";

            var corpo = new
            {
                system_instruction = new
                {
                    parts = new[] { new { text = systemPrompt } }
                },
                contents = new[]
                {
                    new { parts = new[] { new { text = prompt } } }
                }
            };

            var json = JsonSerializer.Serialize(corpo);
            using var conteudo = new StringContent(json, Encoding.UTF8, "application/json");

            HttpResponseMessage resposta;
            try
            {
                resposta = await _httpClient.PostAsync(url, conteudo);
            }
            catch (HttpRequestException ex)
            {
                throw new InvalidOperationException("Não foi possível conectar ao serviço de IA (Gemini). Tente novamente em instantes.", ex);
            }

            var corpoResposta = await resposta.Content.ReadAsStringAsync();

            if (!resposta.IsSuccessStatusCode)
            {
                throw new InvalidOperationException($"Erro ao gerar texto via IA (Gemini, status {(int)resposta.StatusCode}): {corpoResposta}");
            }

            using var documento = JsonDocument.Parse(corpoResposta);
            var texto = documento.RootElement
                .GetProperty("candidates")[0]
                .GetProperty("content")
                .GetProperty("parts")[0]
                .GetProperty("text")
                .GetString();

            if (string.IsNullOrWhiteSpace(texto))
                throw new InvalidOperationException("O serviço de IA retornou uma resposta vazia.");

            return texto.Trim();
        }
    }
}
