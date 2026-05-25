namespace api.DTOs.Planejamento;

public class PaeeSugestaoDatasDTO
{
    /// <summary>
    /// Datas sugeridas (primeiro aluno vinculado, ordenação por nome) dentro do período do PAEE.
    /// </summary>
    public List<DateOnly> Datas { get; set; } = [];
}
