using System.Text.Json;

namespace api.Services;

/// <summary>
/// Gera datas de encontro sugeridas no intervalo conforme dias da semana e limite opcional pela frequência.
/// </summary>
public static class PaeeDatasSugeridasGerador
{
    private static readonly JsonSerializerOptions JsonOpts = new() { PropertyNameCaseInsensitive = true };

    private static readonly Dictionary<string, DayOfWeek> DiaCanonicoParaDow =
        new(StringComparer.OrdinalIgnoreCase)
        {
            ["Segunda"] = DayOfWeek.Monday,
            ["Terça"] = DayOfWeek.Tuesday,
            ["Quarta"] = DayOfWeek.Wednesday,
            ["Quinta"] = DayOfWeek.Thursday,
            ["Sexta"] = DayOfWeek.Friday,
            ["Sábado"] = DayOfWeek.Saturday,
            ["Domingo"] = DayOfWeek.Sunday,
        };

    private static bool TryCanonizarDiaSemana(string entrada, out string canonico)
    {
        canonico = "";
        if (string.IsNullOrWhiteSpace(entrada))
            return false;

        var k = entrada.Trim().ToLowerInvariant()
            .Normalize(System.Text.NormalizationForm.FormD);
        var chars = k.Where(static c =>
            System.Globalization.CharUnicodeInfo.GetUnicodeCategory(c)
            != System.Globalization.UnicodeCategory.NonSpacingMark).ToArray();
        k = new string(chars);

        canonico = k switch
        {
            "segunda" or "segunda-feira" => "Segunda",
            "terca" or "terça" or "terca-feira" or "terça-feira" => "Terça",
            "quarta" or "quarta-feira" => "Quarta",
            "quinta" or "quinta-feira" => "Quinta",
            "sexta" or "sexta-feira" => "Sexta",
            "sabado" or "sábado" => "Sábado",
            "domingo" => "Domingo",
            _ => "",
        };

        return !string.IsNullOrEmpty(canonico);
    }

    public static List<string> DeserializarDiasDaSemana(string? diasSemanaAtendimentoJson)
    {
        if (string.IsNullOrWhiteSpace(diasSemanaAtendimentoJson))
            return [];
        try
        {
            return JsonSerializer.Deserialize<List<string>>(diasSemanaAtendimentoJson, JsonOpts) ?? [];
        }
        catch
        {
            return [];
        }
    }

    /// <summary>
    /// Todas as datas em [dataInicio, dataFim] cujo dia coincide com os informados em ordenação ascendente,
    /// limitadas a um teto segurança (<paramref name="tetoDatas"/>).
    /// </summary>
    public static IReadOnlyList<DateOnly> Sugerir(
        DateOnly dataInicio,
        DateOnly dataFim,
        IReadOnlyCollection<string>? diasBrutosOuCanonicoPtBr,
        int? frequenciaSemanal,
        int tetoDatas = 400)
    {
        if (diasBrutosOuCanonicoPtBr == null || diasBrutosOuCanonicoPtBr.Count == 0)
            return [];

        var lista = diasBrutosOuCanonicoPtBr
            .Select(static d =>
            {
                TryCanonizarDiaSemana(d, out var c);
                return c;
            })
            .Where(static c => DiaCanonicoParaDow.ContainsKey(c))
            .Distinct()
            .ToList();

        if (lista.Count == 0)
            return [];
        var dows = lista.Select(static d => DiaCanonicoParaDow[d]).ToHashSet();

        double? tentativaMax = frequenciaSemanal.HasValue && frequenciaSemanal.Value >= 1
            ? EstimateMaxDates(dataInicio, dataFim, frequenciaSemanal.Value)
            : null;

        var resultado = new List<DateOnly>();
        for (var d = dataInicio; d <= dataFim; d = d.AddDays(1))
        {
            if (!dows.Contains(d.DayOfWeek))
                continue;
            resultado.Add(d);
            if (resultado.Count >= tetoDatas)
                break;
            if (tentativaMax is double max && resultado.Count >= max)
                break;
        }

        return resultado;
    }

    /// <summary>
    /// Aproxima número de dias de encontro: semanas inteiras cobertas * frequênciaSemanal + folga para semana parcial.
    /// </summary>
    private static double EstimateMaxDates(DateOnly dataInicio, DateOnly dataFim, int frequenciaSemanal)
    {
        var diasCalendar = dataFim.DayNumber - dataInicio.DayNumber + 1;
        var semanasAproximadas = Math.Max(1, diasCalendar / 7.0);
        return Math.Ceiling(semanasAproximadas * frequenciaSemanal) + frequenciaSemanal;
    }
}
