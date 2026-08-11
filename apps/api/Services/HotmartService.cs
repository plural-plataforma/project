using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

public class HotmartService
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _config;
    private readonly ILogger<HotmartService> _logger;
    private readonly string _apiUrl;
    private readonly string _tokenUrl;
    private string? _accessToken;
    private DateTime _tokenExpiry = DateTime.MinValue;

    public HotmartService(HttpClient httpClient, IConfiguration config, ILogger<HotmartService> logger)
    {
        _httpClient = httpClient ?? throw new ArgumentNullException(nameof(httpClient));
        _config = config ?? throw new ArgumentNullException(nameof(config));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));

        _apiUrl = (config["API_HOTMART_URL"] ?? throw new InvalidOperationException("API_HOTMART_URL não configurada")).TrimEnd('/');
        _tokenUrl = (config["HOTMART_TOKEN_URL"] ?? throw new InvalidOperationException("HOTMART_TOKEN_URL não configurada")).TrimEnd('/');

        // Configurações permanentes do HttpClient
        _httpClient.Timeout = TimeSpan.FromSeconds(100); // Evita travas infinitas
        _httpClient.DefaultRequestHeaders.UserAgent.ParseAdd("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36");
        _httpClient.DefaultRequestHeaders.Accept.ParseAdd("application/json");
    }

    private async Task<string> GetTokenAsync()
    {
        if (_accessToken != null && DateTime.UtcNow < _tokenExpiry.AddMinutes(-5))
            return _accessToken;

        var clientId = _config["HOTMART_CLIENT_ID"] ?? throw new InvalidOperationException("HOTMART_CLIENT_ID não configurado");
        var clientSecret = _config["HOTMART_CLIENT_SECRET"] ?? throw new InvalidOperationException("HOTMART_CLIENT_SECRET não configurado");

        var basicAuth = Convert.ToBase64String(Encoding.UTF8.GetBytes($"{clientId}:{clientSecret}"));

        var tokenUrl = $"{_tokenUrl}?grant_type=client_credentials" +
                       $"&client_id={Uri.EscapeDataString(clientId)}" +
                       $"&client_secret={Uri.EscapeDataString(clientSecret)}";

        // IMPORTANTE: NÃO limpar todos os headers aqui (remove User-Agent, Accept, etc.)
        // Apenas sobrescreve o Authorization temporariamente
        var previousAuth = _httpClient.DefaultRequestHeaders.Authorization;
        _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Basic", basicAuth);

        try
        {
            var response = await _httpClient.PostAsync(tokenUrl, null);

            var body = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError("Erro ao obter token Hotmart: {StatusCode} - {Body}", response.StatusCode, body);
                throw new HttpRequestException($"Falha ao obter token Hotmart: {response.StatusCode} - {body}");
            }

            var json = JsonSerializer.Deserialize<JsonElement>(body);
            _accessToken = json.GetProperty("access_token").GetString()
                          ?? throw new InvalidOperationException("access_token não encontrado na resposta");

            _tokenExpiry = DateTime.UtcNow.AddMinutes(55); // Hotmart expira em ~60 min

            _logger.LogInformation("Token Hotmart obtido com sucesso. Expira em: {Expiry}", _tokenExpiry);

            return _accessToken;
        }
        finally
        {
            // Restaura o header Authorization anterior (ou remove se não houver)
            _httpClient.DefaultRequestHeaders.Authorization = previousAuth;
        }
    }

    public async Task<List<SaleItem>> GetVendasAsync(
        long? productId = null,
        string? transactionStatus = null,
        DateTime? from = null,
        DateTime? to = null)
    {
        var token = await GetTokenAsync();

        // Configura header de paginação (máximo permitido: 500)
        _httpClient.DefaultRequestHeaders.Remove("max_results");
        _httpClient.DefaultRequestHeaders.Add("max_results", "500");

        var vendasTotais = new List<SaleItem>();
        string? nextPageToken = null;

        do
        {
            var queryParams = new List<string>();

            // Datas padrão mais sensatas: últimos 90 dias se não informado
            var startDate = from ?? DateTime.UtcNow.AddDays(-90);
            var endDate = to ?? DateTime.UtcNow.AddDays(1);

            var startTimestamp = ((DateTimeOffset)startDate).ToUnixTimeMilliseconds();
            var endTimestamp = ((DateTimeOffset)endDate).ToUnixTimeMilliseconds();

            if (productId.HasValue && productId > 0)
                queryParams.Add($"product_id={productId.Value}");

            if (!string.IsNullOrWhiteSpace(transactionStatus))
                queryParams.Add($"transaction_status={transactionStatus}");

            queryParams.Add($"start_date={startTimestamp}");
            queryParams.Add($"end_date={endTimestamp}");

            if (!string.IsNullOrEmpty(nextPageToken))
                queryParams.Add($"page_token={nextPageToken}");

            var url = $"{_apiUrl}/sales/history?{string.Join("&", queryParams)}";

            _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

            HttpResponseMessage response;
            try
            {
                response = await _httpClient.GetAsync(url);
            }
            catch (TaskCanceledException ex) when (ex.InnerException is TimeoutException)
            {
                throw new HttpRequestException("Timeout ao consultar API Hotmart", ex);
            }

            var content = await response.Content.ReadAsStringAsync();

            _logger.LogInformation("Hotmart API → {Status} | {Url}", response.StatusCode, url);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError("Erro Hotmart API: {Status} - {Content}", response.StatusCode, content);
                throw new HttpRequestException($"Erro na API Hotmart: {response.StatusCode} - {content}");
            }

            if (string.IsNullOrWhiteSpace(content))
                break;

            var json = JsonSerializer.Deserialize<JsonElement>(content);

            if (!json.TryGetProperty("items", out var itemsArray) || itemsArray.GetArrayLength() == 0)
                break;

            foreach (var item in itemsArray.EnumerateArray())
            {
                try
                {
                    var purchase = item.GetProperty("purchase");
                    var buyer = item.GetProperty("buyer");
                    var product = item.GetProperty("product");

                    var sale = new SaleItem
                    {
                        Transaction = purchase.GetProperty("transaction").GetString() ?? "",
                        Status = purchase.GetProperty("status").GetString() ?? "",
                        ProductId = product.GetProperty("id").GetInt64(),
                        ProductName = (product.GetProperty("name").GetString() ?? "").Trim(),
                        BuyerEmail = buyer.GetProperty("email").GetString() ?? "",
                        BuyerName = buyer.GetProperty("name").GetString() ?? "",
                        TotalValue = purchase.GetProperty("price").GetProperty("value").GetDecimal(),
                        CreatedDate = DateTimeOffset.FromUnixTimeMilliseconds(purchase.GetProperty("order_date").GetInt64()).DateTime
                    };

                    vendasTotais.Add(sale);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Erro ao processar item individual da venda Hotmart");
                    // Continua processando os outros itens
                }
            }

            // Próxima página
            nextPageToken = json.TryGetProperty("page_info", out var pageInfo)
                ? pageInfo.TryGetProperty("next_page_token", out var tokenEl) && tokenEl.ValueKind != JsonValueKind.Null
                    ? tokenEl.GetString()
                    : null
                : null;

        } while (!string.IsNullOrEmpty(nextPageToken));

        _logger.LogInformation("Total de vendas obtidas: {Count}", vendasTotais.Count);

        return vendasTotais;
    }

    public async Task<List<SubscriptionItem>> GetAssinaturasAsync(string productId, params string[] status)
    {
        var token = await GetTokenAsync();

        var assinaturas = new List<SubscriptionItem>();
        string? nextPageToken = null;

        do
        {
            var queryParams = new List<string> { $"product_id={Uri.EscapeDataString(productId)}", "max_results=100" };
            foreach (var s in status)
                queryParams.Add($"status={Uri.EscapeDataString(s)}");

            if (!string.IsNullOrEmpty(nextPageToken))
                queryParams.Add($"page_token={nextPageToken}");

            var url = $"{_apiUrl}/subscriptions?{string.Join("&", queryParams)}";

            _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

            HttpResponseMessage response;
            try
            {
                response = await _httpClient.GetAsync(url);
            }
            catch (TaskCanceledException ex) when (ex.InnerException is TimeoutException)
            {
                throw new HttpRequestException("Timeout ao consultar assinaturas na API Hotmart", ex);
            }

            var content = await response.Content.ReadAsStringAsync();

            _logger.LogInformation("Hotmart API (assinaturas) → {Status} | {Url}", response.StatusCode, url);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError("Erro Hotmart API (assinaturas): {Status} - {Content}", response.StatusCode, content);
                throw new HttpRequestException($"Erro na API Hotmart (assinaturas): {response.StatusCode} - {content}");
            }

            if (string.IsNullOrWhiteSpace(content))
                break;

            var json = JsonSerializer.Deserialize<JsonElement>(content);

            if (!json.TryGetProperty("items", out var itemsArray) || itemsArray.GetArrayLength() == 0)
                break;

            foreach (var item in itemsArray.EnumerateArray())
            {
                try
                {
                    assinaturas.Add(new SubscriptionItem
                    {
                        SubscriberCode = item.TryGetProperty("subscriber_code", out var codeEl) ? codeEl.GetString() ?? "" : "",
                        Status = item.TryGetProperty("status", out var statusEl) ? statusEl.GetString() ?? "" : "",
                        DateNextChargeRaw = item.TryGetProperty("date_next_charge", out var dncEl) && dncEl.ValueKind == JsonValueKind.Number
                            ? dncEl.GetInt64()
                            : null,
                        SubscriberEmail = item.TryGetProperty("subscriber", out var subEl) && subEl.TryGetProperty("email", out var emailEl)
                            ? emailEl.GetString()
                            : null,
                    });
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Erro ao processar item individual de assinatura Hotmart");
                    // Continua processando os outros itens
                }
            }

            nextPageToken = json.TryGetProperty("page_info", out var pageInfo)
                ? pageInfo.TryGetProperty("next_page_token", out var tokenEl) && tokenEl.ValueKind != JsonValueKind.Null
                    ? tokenEl.GetString()
                    : null
                : null;

        } while (!string.IsNullOrEmpty(nextPageToken));

        _logger.LogInformation("Total de assinaturas obtidas: {Count}", assinaturas.Count);

        return assinaturas;
    }

    public class SaleItem
    {
        public string Transaction { get; set; } = "";
        public string Status { get; set; } = "";
        public long ProductId { get; set; }
        public string ProductName { get; set; } = "";
        public string BuyerEmail { get; set; } = "";
        public string BuyerName { get; set; } = "";
        public decimal TotalValue { get; set; }
        public DateTime CreatedDate { get; set; }
    }

    public class SubscriptionItem
    {
        public string SubscriberCode { get; set; } = "";
        public string Status { get; set; } = "";

        // A doc oficial da Hotmart descreve este campo como milissegundos, mas o exemplo de
        // resposta mostra um valor de 10 dígitos (segundos). Guardamos o valor cru aqui e a
        // conversão fica no job de reconciliação, com heurística de magnitude documentada lá.
        public long? DateNextChargeRaw { get; set; }

        public string? SubscriberEmail { get; set; }
    }
}