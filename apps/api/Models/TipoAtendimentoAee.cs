namespace api.Models;

/// <summary>
/// Tipo de atendimento no AEE conforme cadastro pedagógico (Plural).
/// </summary>
public enum TipoAtendimentoAee
{
    Individual = 0,
    Grupo = 1,
    Colaborativo = 2,
    /// <summary>Valor legado — não aceito em cadastros novos.</summary>
    Itinerante = 3,
}
