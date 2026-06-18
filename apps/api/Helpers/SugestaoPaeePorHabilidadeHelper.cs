using api.Models;
using Microsoft.EntityFrameworkCore;

namespace api.Helpers;

public static class SugestaoPaeePorHabilidadeHelper
{
    public static string FormatarRotuloHabilidade(Habilidade h)
    {
        var partes = new List<string>();
        if (!string.IsNullOrWhiteSpace(h.Tipo))
            partes.Add(h.Tipo.Trim());
        if (!string.IsNullOrWhiteSpace(h.Resumo))
            partes.Add(h.Resumo.Trim());
        else if (!string.IsNullOrWhiteSpace(h.Descricao))
            partes.Add(h.Descricao.Trim());

        return partes.Count > 0 ? string.Join(" — ", partes) : $"Habilidade #{h.Id}";
    }

    /// <summary>
    /// A partir dos desempenhos vigentes (um por atividade), lista habilidades fortes e a reforçar.
    /// </summary>
    public static async Task<(string HabilidadesFortes, string HabilidadesAReenforcar)> CalcularAsync(
        Data.AppDbContext contexto,
        IReadOnlyList<DesempenhoAtividade> desempenhosVigentes,
        CancellationToken cancellationToken = default)
    {
        if (desempenhosVigentes.Count == 0)
            return ("", "");

        var atividadeIds = desempenhosVigentes.Select(d => d.AtividadeId).Distinct().ToList();
        var atividades = await contexto.Atividades
            .AsNoTracking()
            .Include(a => a.Habilidades)
            .Where(a => atividadeIds.Contains(a.Id))
            .ToListAsync(cancellationToken);

        var fortes = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        var reforcar = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        foreach (var desempenho in desempenhosVigentes)
        {
            var atividade = atividades.FirstOrDefault(a => a.Id == desempenho.AtividadeId);
            if (atividade?.Habilidades == null)
                continue;

            foreach (var habilidade in atividade.Habilidades)
            {
                var rotulo = FormatarRotuloHabilidade(habilidade);
                if (string.Equals(desempenho.NivelRealizacao, "Autonomia", StringComparison.OrdinalIgnoreCase))
                    fortes.Add(rotulo);
                else if (
                    string.Equals(desempenho.NivelRealizacao, "ComAjuda", StringComparison.OrdinalIgnoreCase)
                    || string.Equals(desempenho.NivelRealizacao, "NaoRealizou", StringComparison.OrdinalIgnoreCase))
                {
                    reforcar.Add(rotulo);
                }
            }
        }

        return (
            string.Join("; ", fortes.OrderBy(x => x, StringComparer.OrdinalIgnoreCase)),
            string.Join("; ", reforcar.OrderBy(x => x, StringComparer.OrdinalIgnoreCase))
        );
    }

    /// <summary>Versão síncrona quando atividades já estão carregadas (ex.: MontarDetailDTO).</summary>
    public static (string HabilidadesFortes, string HabilidadesAReenforcar) CalcularFromAtividades(
        IReadOnlyList<DesempenhoAtividade> desempenhosVigentes,
        IReadOnlyDictionary<int, Atividade> atividadePorId)
    {
        if (desempenhosVigentes.Count == 0)
            return ("", "");

        var fortes = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        var reforcar = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        foreach (var desempenho in desempenhosVigentes)
        {
            if (!atividadePorId.TryGetValue(desempenho.AtividadeId, out var atividade) || atividade.Habilidades == null)
                continue;

            foreach (var habilidade in atividade.Habilidades)
            {
                var rotulo = FormatarRotuloHabilidade(habilidade);
                if (string.Equals(desempenho.NivelRealizacao, "Autonomia", StringComparison.OrdinalIgnoreCase))
                    fortes.Add(rotulo);
                else if (
                    string.Equals(desempenho.NivelRealizacao, "ComAjuda", StringComparison.OrdinalIgnoreCase)
                    || string.Equals(desempenho.NivelRealizacao, "NaoRealizou", StringComparison.OrdinalIgnoreCase))
                {
                    reforcar.Add(rotulo);
                }
            }
        }

        return (
            string.Join("; ", fortes.OrderBy(x => x, StringComparer.OrdinalIgnoreCase)),
            string.Join("; ", reforcar.OrderBy(x => x, StringComparer.OrdinalIgnoreCase))
        );
    }
}
