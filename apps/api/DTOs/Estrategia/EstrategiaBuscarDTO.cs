using System.Text.Json.Serialization;

namespace api.DTOs.Estrategia
{

    public class EstrategiaBuscarDTO
    {
        public int Id { get; set; }


        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public string Descricao { get; set; }

        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public bool? Ativo { get; set; }
    }
    
}
