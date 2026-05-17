namespace api.Constants;

/// <summary>
/// Níveis discretos de perfil de autonomia (visão agregada da avaliação diagnóstica / PAEE).
/// Substitui o antigo percentual numérico armazenado em diagnóstico final.
/// </summary>
public static class NivelPerfilAutonomiaValores
{
    public const string NaoAvaliado = "NaoAvaliado";
    public const string PredominioDependencia = "PredominioDependencia";
    public const string AutonomiaMediada = "AutonomiaMediada";
    public const string PredominioAutonomia = "PredominioAutonomia";
}
