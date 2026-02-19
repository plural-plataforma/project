using System.Text.Json.Serialization;

namespace api.Responses // ou api.DTOs.Imgur, conforme sua estrutura
{
    public class ImgurResponse
    {
        [JsonPropertyName("data")]
        public ImgurData? Data { get; set; }

        [JsonPropertyName("success")]
        public bool Success { get; set; }

        [JsonPropertyName("status")]
        public int Status { get; set; }
    }

    public class ImgurData
    {
        [JsonPropertyName("id")]
        public string? Id { get; set; }

        [JsonPropertyName("link")]
        public string? Link { get; set; }  // ← Essa é a URL direta da imagem (o que você quer!)

        [JsonPropertyName("deletehash")]
        public string? Deletehash { get; set; }  // Útil para deletar depois

        [JsonPropertyName("type")]
        public string? Type { get; set; }

        [JsonPropertyName("width")]
        public int Width { get; set; }

        [JsonPropertyName("height")]
        public int Height { get; set; }

        // Outros campos opcionais (adicione se precisar)
        public string? Title { get; set; }
        public string? Description { get; set; }
        public long? Datetime { get; set; }
        public long? Size { get; set; }
        public int? Views { get; set; }
        public bool? Animated { get; set; }
        // ... etc.
    }
}