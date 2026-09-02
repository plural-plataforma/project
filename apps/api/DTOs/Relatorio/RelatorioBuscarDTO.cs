using api.Models;

namespace api.DTOs.Relatorio;

public class RelatorioBuscarDTO
{
    public int Id { get; set; }

    public int AlunoId { get; set; }

    public string AlunoNome { get; set; } = "";

    /// <summary>Dados de identificação vindos direto do cadastro — não passam por IA, usados na exportação (ver seção 4.3 do doc da fase 6).</summary>
    public DateOnly? AlunoDataNascimento { get; set; }
    public string? AlunoAno { get; set; }
    public string? EscolaNomeInstituicao { get; set; }
    public string? ProfessorNomeCompleto { get; set; }
    public int? AlunoFrequenciaSemanalAtendimento { get; set; }
    public int? AlunoDuracaoAtendimentoMinutos { get; set; }
    public TipoAtendimentoAee? AlunoTipoAtendimentoAee { get; set; }

    public DateOnly DataInicio { get; set; }

    public DateOnly DataFim { get; set; }

    public RelatorioTipoPeriodo TipoPeriodo { get; set; }

    public RelatorioStatus Status { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    public List<RelatorioSecaoDTO> Secoes { get; set; } = [];
}
