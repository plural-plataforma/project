namespace api.Models
{
    public enum TipoDocumentoIA
    {
        EstudoCaso = 0,
        PAEE = 1,
        AvaliacaoDiagnostica = 2,
        RelatoAtendimento = 3,
        RelatorioPedagogico = 4,
        // Reescrita de uma única seção do Relatório Pedagógico, incorporando as notas
        // manuais da professora ao texto — não gera documento inteiro.
        RelatorioSecaoReescrita = 5,
    }
}
