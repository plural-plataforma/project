namespace api.DTOs.RelatoAtendimento;

public class RelatoSugestoesMesDTO
{
    public int Ano { get; set; }

    public int Mes { get; set; }

    public List<DateOnly> DatasSugeridas { get; set; } = [];

    /// <summary>Datas do mês já com relato registrado (mesmo aluno).</summary>
    public List<DateOnly> DatasComRelatoRegistrado { get; set; } = [];
}
