using System.Text.Json.Serialization;

namespace api.DTOs.Avaliacao
{

    public class AvaliacaoBuscarDTO
    {
        public int Id { get; set; }


        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public string Descricao { get; set; }

        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public string Resumo { get; set; }

        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public bool? Ativo { get; set; }
    }
    
}
