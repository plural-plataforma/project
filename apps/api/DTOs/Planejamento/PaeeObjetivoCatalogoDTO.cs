namespace api.DTOs.Planejamento;

public class PaeeObjetivoCatalogoDTO
{
    public int Id { get; set; }

    public string Codigo { get; set; } = string.Empty;

    public string Rotulo { get; set; } = string.Empty;

    public string TextoModelo { get; set; } = string.Empty;

    /// <summary>Curto | Medio | Longo</summary>
    public string Prazo { get; set; } = string.Empty;

    public int OrdemExibicao { get; set; }
}
