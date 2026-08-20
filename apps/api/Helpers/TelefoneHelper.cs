namespace api.Helpers;

/// <summary>
/// Normalização de telefone para o formato E.164 (+DDI + número), usado no cadastro
/// e no payload do webhook de onboarding (automações de WhatsApp dependem desse formato).
/// </summary>
public static class TelefoneHelper
{
    private const string DdiPadraoBrasil = "55";
    private const int MinimoDigitos = 8;
    private const int MaximoDigitos = 15;

    /// <summary>
    /// Junta DDI e número, descarta qualquer caractere que não seja dígito e devolve "+DDI...".
    /// Retorna null quando não sobra um número plausível (vazio, curto demais ou longo demais).
    /// </summary>
    public static string? Normalizar(string? telefone, string? ddi = null)
    {
        var digitos = ApenasDigitos(telefone);
        if (string.IsNullOrEmpty(digitos))
            return null;

        var digitosDdi = ApenasDigitos(ddi);

        if (!string.IsNullOrEmpty(digitosDdi))
        {
            if (!digitos.StartsWith(digitosDdi, StringComparison.Ordinal))
                digitos = digitosDdi + digitos;
        }
        else if (digitos.Length <= 11)
        {
            // Número nacional (DDD + telefone) sem DDI: assume Brasil.
            digitos = DdiPadraoBrasil + digitos;
        }

        if (digitos.Length < MinimoDigitos || digitos.Length > MaximoDigitos)
            return null;

        return "+" + digitos;
    }

    private static string ApenasDigitos(string? valor)
    {
        if (string.IsNullOrWhiteSpace(valor))
            return string.Empty;

        return new string(valor.Where(char.IsDigit).ToArray());
    }
}
