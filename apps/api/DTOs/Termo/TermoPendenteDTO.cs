namespace api.DTOs.Termo;

public class TermoPendenteDTO
{
    public int TermoVersaoId { get; set; }
    public string Chave { get; set; } = "";
    public string Nome { get; set; } = "";
    public int Versao { get; set; }
    public string Texto { get; set; } = "";
}
