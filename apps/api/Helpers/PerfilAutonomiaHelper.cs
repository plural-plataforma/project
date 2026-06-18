using System.Globalization;
using api.Constants;

namespace api.Helpers;

public static class PerfilAutonomiaHelper
{
    private static readonly HashSet<string> NiveisParaDenominador =
        new(StringComparer.OrdinalIgnoreCase) { "Autonomia", "ComAjuda", "NaoRealizou" };

    /// <summary>
    /// Converte o percentual legado (0–100, proporção de atividades em "Autonomia") em nível discreto.
    /// Cortes: &lt;34 dependência; &lt;67 mediação; caso contrário predominância de autonomia.
    /// </summary>
    public static string DePercentualLegado(double percentualAutonomia)
    {
        if (percentualAutonomia < 34d)
            return NivelPerfilAutonomiaValores.PredominioDependencia;
        if (percentualAutonomia < 67d)
            return NivelPerfilAutonomiaValores.AutonomiaMediada;
        return NivelPerfilAutonomiaValores.PredominioAutonomia;
    }

    /// <summary>
    /// Agrega registros por aluno: considera só Autonomia / ComAjuda / NaoRealizou;
    /// calcula % de "Autonomia" sobre essas atividades e aplica os mesmos cortes do legado.
    /// </summary>
    public static string DeNiveisRealizacao(IEnumerable<string?> niveisRealizacao)
    {
        var (nivel, _) = DeNiveisRealizacaoComPercentual(niveisRealizacao);
        return nivel;
    }

    public static (string nivel, double? percentualAutonomiaCalculado) DeNiveisRealizacaoComPercentual(
        IEnumerable<string?> niveisRealizacao)
    {
        var lista = niveisRealizacao
            .Where(n => !string.IsNullOrWhiteSpace(n) && NiveisParaDenominador.Contains(n!))
            .Select(n => n!.Trim())
            .ToList();

        if (lista.Count == 0)
            return (NivelPerfilAutonomiaValores.NaoAvaliado, null);

        var countAutonomia = lista.Count(static x =>
            string.Equals(x, "Autonomia", StringComparison.OrdinalIgnoreCase));

        var pct = 100d * countAutonomia / lista.Count;
        var nivel = DePercentualLegado(pct);
        return (nivel, Math.Round(pct, 1));
    }

    public static string RotuloPortugues(string nivelPerfilAutonomia)
    {
        return nivelPerfilAutonomia switch
        {
            NivelPerfilAutonomiaValores.PredominioDependencia => "Predomínio de dependência / necessidade de suporte",
            NivelPerfilAutonomiaValores.AutonomiaMediada => "Autonomia mediada (equilíbrio entre suporte e independência)",
            NivelPerfilAutonomiaValores.PredominioAutonomia => "Predomínio de autonomia nas atividades avaliadas",
            _ => "Autonomia ainda não avaliada (preencha os níveis por atividade)",
        };
    }

    /// <summary>Sugestão pedagógica breve para apoiar planejamento PAEE (não substitui avaliação profissional).</summary>
    public static string SugestaoPaee(string nivelPerfilAutonomia)
    {
        return nivelPerfilAutonomia switch
        {
            NivelPerfilAutonomiaValores.PredominioDependencia =>
                "Priorize estratégias de mediação intensiva, segmentação de tarefas e retroalimentação frequente; registre avanços por micro-etapas.",
            NivelPerfilAutonomiaValores.AutonomiaMediada =>
                "Combine momentos de modelagem e retirada gradual do suporte; alterne atividades guiadas e semi-independentes conforme o perfil do aluno.",
            NivelPerfilAutonomiaValores.PredominioAutonomia =>
                "Potencialize generalização e desafios graduais; mantenha checkpoints para garantir manutenção dos hábitos autônomos.",
            _ =>
                "Complete o registro de desempenho por atividade para gerar o perfil de autonomia e sugestões de PAEE.",
        };
    }

    public static string PercentualResumoFormatado(double percentualAutonomia) =>
        percentualAutonomia.ToString("0.#", CultureInfo.InvariantCulture) + "%";
}
