using System.Text.Json.Serialization;

namespace api.DTOs.Habilidade
{

    public class HabilidadeBuscarDTO
    {
        public int Id { get; set; }

        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public int? IdNivelEnsino { get; set; }

        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public string? Tipo { get; set; }
        public string Descricao { get; set; } = string.Empty;

        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public string? Resumo { get; set; }

        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public bool? Ativo { get; set; }
    }
    
}
