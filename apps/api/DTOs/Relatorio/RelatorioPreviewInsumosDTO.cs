namespace api.DTOs.Relatorio;

public class RelatorioPreviewInsumosDTO
{
    public string AlunoNome { get; set; } = "";

    public bool TemEstudoCaso { get; set; }

    public int QuantidadePlanejamentosVigentes { get; set; }

    public int QuantidadeRelatosNoPeriodo { get; set; }

    public int QuantidadeRelatosComPresenca { get; set; }

    public int QuantidadeAvaliacoesNoPeriodo { get; set; }

    // Regra da cliente: comparação início/meio/fim só faz sentido com período >= 3 meses.
    public bool PeriodoElegivelParaComparacaoEvolucao { get; set; }

    public List<string> Avisos { get; set; } = [];
}
