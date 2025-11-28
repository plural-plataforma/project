using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Transactions;

public class HotmartService
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _config;
    private readonly ILogger<HotmartService> _logger;
    private string? _accessToken;
    private DateTime _tokenExpiry = DateTime.MinValue;

    public HotmartService(HttpClient httpClient, IConfiguration config, ILogger<HotmartService> logger)
    {
        _httpClient = httpClient;
        _config = config;
        _logger = logger;
    }

    private async Task<string> GetTokenAsync()
    {
        if (_accessToken != null && DateTime.UtcNow < _tokenExpiry.AddMinutes(-5))
            return _accessToken!;

        var clientId = _config["Hotmart:ClientId"]!;
        var clientSecret = _config["Hotmart:ClientSecret"]!;

        // 1. Basic Auth no header (base64 de client_id:client_secret)
        var basicAuth = Convert.ToBase64String(Encoding.UTF8.GetBytes($"{clientId}:{clientSecret}"));

        // 2. URL com query params (exato do seu curl)
        var tokenUrl = "https://api-sec-vlc.hotmart.com/security/oauth/token" +
                       "?grant_type=client_credentials" +
                       $"&client_id={Uri.EscapeDataString(clientId)}" +
                       $"&client_secret={Uri.EscapeDataString(clientSecret)}";

        // 3. Limpa headers e adiciona só o Authorization
        _httpClient.DefaultRequestHeaders.Clear();
        _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Basic", basicAuth);

        // 4. POST sem body (Content-Length: 0) → NÃO ADICIONA Content-Type!
        var response = await _httpClient.PostAsync(tokenUrl, null!);
        var body = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
        {
            _logger.LogError("Erro token Hotmart: {Status} - {Body}", response.StatusCode, body);
            throw new Exception($"Falha ao obter token: {response.StatusCode} - {body}");
        }

        var json = JsonSerializer.Deserialize<JsonElement>(body);
        _accessToken = json.GetProperty("access_token").GetString()!;
        _tokenExpiry = DateTime.UtcNow.AddMinutes(55);

        return _accessToken;
    }

    public async Task<List<SaleItem>> GetVendasAsync(
        long? productId = null,
        string? transactionStatus = null,
        DateTime? from = null,
        DateTime? to = null)
    {
        var token = await GetTokenAsync();

        // ENDPOINT REAL (VLC) — OBRIGATÓRIO page_token= (mesmo vazio)
        var url = "https://developers.hotmart.com/payments/api/v1/sales/history?";

        if (productId.HasValue) url += $"&product_id={productId.Value}";
        if (!string.IsNullOrWhiteSpace(transactionStatus)) url += $"&transaction_status={transactionStatus}";
        if (from.HasValue) url += $"&start_date={from.Value:yyyy-MM-dd}";
        if (to.HasValue) url += $"&end_date={to.Value:yyyy-MM-dd}";

        _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var response = await _httpClient.GetAsync(url);
        var content = await response.Content.ReadAsStringAsync();

        _logger.LogInformation("Hotmart Response: {Status} | Body: {Body}", response.StatusCode, content);

        if (!response.IsSuccessStatusCode)
            throw new Exception($"Erro Hotmart: {response.StatusCode}");

        if (string.IsNullOrWhiteSpace(content))
            return new List<SaleItem>();

        var json = JsonSerializer.Deserialize<JsonElement>(content);

        if (!json.TryGetProperty("items", out var itemsArray))
            return new List<SaleItem>();

        var vendas = new List<SaleItem>();

        foreach (var item in itemsArray.EnumerateArray())
        {
            var purchase = item.GetProperty("purchase");
            var buyer = item.GetProperty("buyer");
            var product = item.GetProperty("product");

            vendas.Add(new SaleItem
            {
                Transaction = purchase.GetProperty("transaction").GetString() ?? "",
                Status = purchase.GetProperty("status").GetString() ?? "",
                ProductId = product.GetProperty("id").GetInt64(),
                ProductName = product.GetProperty("name").GetString() ?? "",
                BuyerEmail = buyer.GetProperty("email").GetString() ?? "",
                BuyerName = buyer.GetProperty("name").GetString() ?? "",
                TotalValue = purchase.GetProperty("price").GetProperty("value").GetDecimal(),
                CreatedDate = DateTimeOffset.FromUnixTimeMilliseconds(purchase.GetProperty("order_date").GetInt64()).DateTime
            });
        }

        return vendas;
    }
    // SaleItem atualizado para o seu caso real
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
}