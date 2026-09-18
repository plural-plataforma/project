namespace api.Models
{
    public enum TipoDocumentoIA
    {
        EstudoCaso = 0,
        PAEE = 1,
        AvaliacaoDiagnostica = 2,
        RelatoAtendimento = 3,
        RelatorioPedagogico = 4,
        // Revisão final do texto que a professora editou no Relatório Pedagógico, aplicando
        // vocabulário técnico e o formato escolhido (tópicos ou texto corrido) — não gera
        // conteúdo novo, só melhora a redação do que já foi escrito.
        RelatorioTextoFinal = 5,
    }
}
