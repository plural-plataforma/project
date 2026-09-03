using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using api.DTOs.Relatorio;
using api.Models;
using api.Responses;
using api.Services.IA;
using Data;
using Microsoft.EntityFrameworkCore;

namespace api.Services;

public class RelatorioService
{
    private static readonly JsonSerializerOptions JsonOpcoes = new()
    {
        PropertyNameCaseInsensitive = true,
    };

    private readonly AppDbContext _db;
    private readonly PromptSistemaIAService _promptService;
    private readonly IGeradorTextoIA _geradorTextoIA;
    private readonly GeracaoIALogService _geracaoLog;
    private readonly IRelatorioGeracaoQueue _geracaoQueue;
    private readonly NotificacaoService _notificacaoService;

    public RelatorioService(
        AppDbContext db,
        PromptSistemaIAService promptService,
        IGeradorTextoIA geradorTextoIA,
        GeracaoIALogService geracaoLog,
        IRelatorioGeracaoQueue geracaoQueue,
        NotificacaoService notificacaoService)
    {
        _db = db;
        _promptService = promptService;
        _geradorTextoIA = geradorTextoIA;
        _geracaoLog = geracaoLog;
        _geracaoQueue = geracaoQueue;
        _notificacaoService = notificacaoService;
    }

    // Insumos levantados automaticamente pra montar o relatório — usado tanto no preview
    // (S2) quanto no prompt de geração via IA (S3). Ausência de qualquer fonte não bloqueia
    // o levantamento: cada seção sem dado é sinalizada e vira preenchimento manual depois.
    private class RelatorioInsumos
    {
        public Aluno Aluno { get; set; } = null!;
        public EstudoDeCaso? EstudoDeCaso { get; set; }
        public List<Planejamento> PlanejamentosVigentes { get; set; } = [];
        public List<RelatoAtendimento> RelatosNoPeriodo { get; set; } = [];
        public List<AvaliacaoDiagnostica> AvaliacoesNoPeriodo { get; set; } = [];
    }

    private async Task<RelatorioInsumos?> MontarInsumosAsync(
        int professorId,
        int alunoId,
        DateOnly dataInicio,
        DateOnly dataFim)
    {
        var aluno = await _db.Alunos
            .Include(a => a.Escola)
            .AsNoTracking()
            .FirstOrDefaultAsync(a => a.Id == alunoId && a.IdProfessor == professorId);
        if (aluno == null)
            return null;

        var estudoDeCaso = await _db.EstudosCaso
            .Include(e => e.ItensEixo).ThenInclude(i => i.CatalogoEixo)
            .AsNoTracking()
            .Where(e => e.AlunoId == alunoId)
            .OrderByDescending(e => e.CreatedAt)
            .FirstOrDefaultAsync();

        var planejamentosVigentes = await _db.Planejamentos
            .Include(p => p.HabilidadesXPlanejamentos).ThenInclude(h => h.Habilidade)
            .Include(p => p.EstrategiasXPlanejamentos).ThenInclude(e => e.Estrategia)
            .Include(p => p.ObjetivoCurtoCatalogo)
            .Include(p => p.ObjetivoMedioCatalogo)
            .Include(p => p.ObjetivoLongoCatalogo)
            .AsNoTracking()
            .Where(p => p.AlunosXPlanejamentos.Any(a => a.AlunoId == alunoId)
                && p.DataInicio <= dataFim && p.DataFim >= dataInicio)
            .ToListAsync();

        var relatos = await _db.RelatosAtendimento
            .Include(r => r.Habilidade)
            .Include(r => r.Estrategia)
            .AsNoTracking()
            .Where(r => r.AlunoId == alunoId && r.DataSessao >= dataInicio && r.DataSessao <= dataFim)
            .OrderBy(r => r.DataSessao)
            .ToListAsync();

        var inicioDateTime = DateTime.SpecifyKind(dataInicio.ToDateTime(TimeOnly.MinValue), DateTimeKind.Utc);
        var fimDateTime = DateTime.SpecifyKind(dataFim.ToDateTime(TimeOnly.MaxValue), DateTimeKind.Utc);

        var avaliacoes = await _db.AvaliacoesDiagnosticas
            .Include(a => a.RegistrosDesempenho.Where(d => d.AlunoId == alunoId))
            .AsNoTracking()
            .Where(a => a.DataAplicacao >= inicioDateTime && a.DataAplicacao <= fimDateTime
                && a.AlunosParticipantes.Any(p => p.AlunoId == alunoId))
            .ToListAsync();

        return new RelatorioInsumos
        {
            Aluno = aluno,
            EstudoDeCaso = estudoDeCaso,
            PlanejamentosVigentes = planejamentosVigentes,
            RelatosNoPeriodo = relatos,
            AvaliacoesNoPeriodo = avaliacoes,
        };
    }

    public async Task<ServiceResponse<RelatorioPreviewInsumosDTO>> PreviewInsumosAsync(
        Usuario usuario,
        int alunoId,
        DateOnly dataInicio,
        DateOnly dataFim)
    {
        var resposta = new ServiceResponse<RelatorioPreviewInsumosDTO>();
        var professorId = usuario.ProfessorId ?? 0;
        if (professorId == 0)
        {
            resposta.SetFalha("Professor não identificado.");
            return resposta;
        }

        if (dataInicio > dataFim)
        {
            resposta.SetFalha("Data inicial não pode ser posterior à final.");
            return resposta;
        }

        try
        {
            var insumos = await MontarInsumosAsync(professorId, alunoId, dataInicio, dataFim);
            if (insumos == null)
            {
                resposta.SetFalha("Aluno não encontrado ou sem permissão.");
                return resposta;
            }

            var avisos = new List<string>();
            if (insumos.EstudoDeCaso == null)
                avisos.Add("Sem estudo de caso registrado — as seções Contextualização, Potencialidades e Barreiras podem ficar incompletas (dá pra complementar manualmente na revisão).");
            if (insumos.PlanejamentosVigentes.Count == 0)
                avisos.Add("Nenhum PAEE vigente no período — as seções Estratégias e parte da Evolução podem ficar incompletas.");
            if (insumos.RelatosNoPeriodo.Count == 0)
                avisos.Add("Nenhum relato de atendimento no período — a seção Evolução pode ficar incompleta.");
            if (insumos.AvaliacoesNoPeriodo.Count == 0)
                avisos.Add("Nenhuma avaliação diagnóstica no período — a seção Aspectos acadêmicos pode ficar incompleta.");

            resposta.AdicionaObjeto(new RelatorioPreviewInsumosDTO
            {
                AlunoNome = insumos.Aluno.NomeCompleto,
                TemEstudoCaso = insumos.EstudoDeCaso != null,
                QuantidadePlanejamentosVigentes = insumos.PlanejamentosVigentes.Count,
                QuantidadeRelatosNoPeriodo = insumos.RelatosNoPeriodo.Count,
                QuantidadeRelatosComPresenca = insumos.RelatosNoPeriodo.Count(r => r.PresencaPresente),
                QuantidadeAvaliacoesNoPeriodo = insumos.AvaliacoesNoPeriodo.Count,
                QuantidadeLancamentosDesempenho = insumos.AvaliacoesNoPeriodo.Sum(a => a.RegistrosDesempenho.Count),
                PeriodoElegivelParaComparacaoEvolucao = dataInicio.AddMonths(3) <= dataFim,
                Avisos = avisos,
            });
            return resposta;
        }
        catch (Exception ex)
        {
            resposta.SetFalha("Erro ao levantar dados do relatório: " + ex.Message);
            return resposta;
        }
    }

    // Espelha, em snake_case, as 14 seções de RelatorioSecaoChave (Identificação fica de
    // fora — é preenchida direto do cadastro na exportação, não passa por IA).
    private class RelatorioIAResultado
    {
        [JsonPropertyName("contextualizacao")] public string? Contextualizacao { get; set; }
        [JsonPropertyName("potencialidades")] public string? Potencialidades { get; set; }
        [JsonPropertyName("comunicacao")] public string? Comunicacao { get; set; }
        [JsonPropertyName("cognicao")] public string? Cognicao { get; set; }
        [JsonPropertyName("academico")] public string? Academico { get; set; }
        [JsonPropertyName("interacao")] public string? Interacao { get; set; }
        [JsonPropertyName("autonomia")] public string? Autonomia { get; set; }
        [JsonPropertyName("motor_sensorial")] public string? MotorSensorial { get; set; }
        [JsonPropertyName("barreiras")] public string? Barreiras { get; set; }
        [JsonPropertyName("estrategias")] public string? Estrategias { get; set; }
        [JsonPropertyName("evolucao")] public string? Evolucao { get; set; }
        [JsonPropertyName("necessidades")] public string? Necessidades { get; set; }
        [JsonPropertyName("encaminhamentos")] public string? Encaminhamentos { get; set; }
        [JsonPropertyName("conclusao")] public string? Conclusao { get; set; }
    }

    private static Dictionary<RelatorioSecaoChave, string?> ParaDicionario(RelatorioIAResultado r) => new()
    {
        [RelatorioSecaoChave.Contextualizacao] = r.Contextualizacao,
        [RelatorioSecaoChave.Potencialidades] = r.Potencialidades,
        [RelatorioSecaoChave.Comunicacao] = r.Comunicacao,
        [RelatorioSecaoChave.Cognicao] = r.Cognicao,
        [RelatorioSecaoChave.Academico] = r.Academico,
        [RelatorioSecaoChave.Interacao] = r.Interacao,
        [RelatorioSecaoChave.Autonomia] = r.Autonomia,
        [RelatorioSecaoChave.MotorSensorial] = r.MotorSensorial,
        [RelatorioSecaoChave.Barreiras] = r.Barreiras,
        [RelatorioSecaoChave.Estrategias] = r.Estrategias,
        [RelatorioSecaoChave.Evolucao] = r.Evolucao,
        [RelatorioSecaoChave.Necessidades] = r.Necessidades,
        [RelatorioSecaoChave.Encaminhamentos] = r.Encaminhamentos,
        [RelatorioSecaoChave.Conclusao] = r.Conclusao,
    };

    // Gemini às vezes envolve o JSON em cerca de código (```json ... ```) mesmo quando
    // instruído a não fazer isso — removemos antes de desserializar.
    private static RelatorioIAResultado? ParseResultadoIA(string texto)
    {
        var limpo = texto.Trim();
        if (limpo.StartsWith("```"))
        {
            var primeiraQuebra = limpo.IndexOf('\n');
            limpo = primeiraQuebra >= 0 ? limpo[(primeiraQuebra + 1)..] : limpo[3..];
            if (limpo.EndsWith("```"))
                limpo = limpo[..^3];
            limpo = limpo.Trim();
        }

        try
        {
            return JsonSerializer.Deserialize<RelatorioIAResultado>(limpo, JsonOpcoes);
        }
        catch
        {
            return null;
        }
    }

    private static int CalcularIdade(DateOnly nascimento, DateOnly referencia)
    {
        var idade = referencia.Year - nascimento.Year;
        if (nascimento > referencia.AddYears(-idade))
            idade--;
        return idade;
    }

    private static string MontarPromptRelatorio(
        RelatorioInsumos insumos,
        DateOnly dataInicio,
        DateOnly dataFim,
        RelatorioTipoPeriodo tipoPeriodo)
    {
        var aluno = insumos.Aluno;
        var sb = new StringBuilder();

        sb.AppendLine("Gere o Relatório Pedagógico do AEE deste estudante a partir exclusivamente dos dados abaixo. Siga as regras do system prompt.");
        sb.AppendLine();
        sb.AppendLine($"Período do relatório: {dataInicio:dd/MM/yyyy} a {dataFim:dd/MM/yyyy} ({tipoPeriodo}).");
        sb.Append($"Estudante: {aluno.NomeCompleto}");
        if (aluno.DataNascimento.HasValue)
            sb.Append($", {CalcularIdade(aluno.DataNascimento.Value, dataFim)} anos");
        sb.AppendLine();

        if (!string.IsNullOrWhiteSpace(aluno.Escola?.NomeInstituicao))
            sb.AppendLine($"Escola: {aluno.Escola.NomeInstituicao}");
        if (!string.IsNullOrWhiteSpace(aluno.Ano))
            sb.AppendLine($"Ano/etapa: {aluno.Ano}");
        if (aluno.FrequenciaSemanalAtendimento.HasValue)
            sb.AppendLine($"Frequência semanal de atendimento: {aluno.FrequenciaSemanalAtendimento}x por semana");
        if (aluno.TipoAtendimentoAee.HasValue)
            sb.AppendLine($"Tipo de atendimento: {aluno.TipoAtendimentoAee}");
        if (!string.IsNullOrWhiteSpace(aluno.PerfilPedagogicoPotencialidades))
            sb.AppendLine($"Potencialidades cadastradas no perfil do aluno: {aluno.PerfilPedagogicoPotencialidades}");
        if (!string.IsNullOrWhiteSpace(aluno.PerfilPedagogicoNecessidades))
            sb.AppendLine($"Necessidades cadastradas no perfil do aluno: {aluno.PerfilPedagogicoNecessidades}");
        sb.AppendLine();

        sb.AppendLine("=== Estudo de Caso ===");
        if (insumos.EstudoDeCaso != null)
        {
            var ec = insumos.EstudoDeCaso;
            if (!string.IsNullOrWhiteSpace(ec.ContextoSituacao))
                sb.AppendLine($"Contexto/situação: {ec.ContextoSituacao}");
            if (!string.IsNullOrWhiteSpace(ec.Potencialidades))
                sb.AppendLine($"Potencialidades: {ec.Potencialidades}");
            foreach (var item in ec.ItensEixo)
            {
                if (!string.IsNullOrWhiteSpace(item.Anotacao))
                    sb.AppendLine($"- {item.CatalogoEixo?.Rotulo}: {item.Anotacao}");
            }
        }
        else
        {
            sb.AppendLine("Nenhum estudo de caso registrado para este aluno.");
        }
        sb.AppendLine();

        sb.AppendLine("=== PAEE vigente(s) no período ===");
        if (insumos.PlanejamentosVigentes.Count > 0)
        {
            foreach (var p in insumos.PlanejamentosVigentes)
            {
                sb.AppendLine($"- {p.Apelido} ({p.DataInicio:dd/MM/yyyy} a {p.DataFim:dd/MM/yyyy})");
                var objetivoCurto = p.ObjetivoCurtoCatalogo?.Rotulo ?? p.ObjetivoCurtoPrazo;
                var objetivoMedio = p.ObjetivoMedioCatalogo?.Rotulo ?? p.ObjetivoMedioPrazo;
                var objetivoLongo = p.ObjetivoLongoCatalogo?.Rotulo ?? p.ObjetivoLongoPrazo;
                if (!string.IsNullOrWhiteSpace(objetivoCurto)) sb.AppendLine($"  Objetivo curto prazo: {objetivoCurto}");
                if (!string.IsNullOrWhiteSpace(objetivoMedio)) sb.AppendLine($"  Objetivo médio prazo: {objetivoMedio}");
                if (!string.IsNullOrWhiteSpace(objetivoLongo)) sb.AppendLine($"  Objetivo longo prazo: {objetivoLongo}");

                var habilidades = p.HabilidadesXPlanejamentos?
                    .Select(h => h.Habilidade?.Resumo ?? h.Habilidade?.Descricao)
                    .Where(h => !string.IsNullOrWhiteSpace(h))
                    .ToList() ?? [];
                if (habilidades.Count > 0)
                    sb.AppendLine($"  Habilidades trabalhadas: {string.Join("; ", habilidades)}");

                var estrategias = p.EstrategiasXPlanejamentos?
                    .Select(e => e.Estrategia?.Descricao)
                    .Where(e => !string.IsNullOrWhiteSpace(e))
                    .ToList() ?? [];
                if (estrategias.Count > 0)
                    sb.AppendLine($"  Estratégias definidas: {string.Join("; ", estrategias)}");
            }
        }
        else
        {
            sb.AppendLine("Nenhum PAEE vigente no período.");
        }
        sb.AppendLine();

        sb.AppendLine("=== Relatos de atendimento no período ===");
        if (insumos.RelatosNoPeriodo.Count > 0)
        {
            foreach (var r in insumos.RelatosNoPeriodo)
            {
                sb.Append($"- {r.DataSessao:dd/MM/yyyy}: {(r.PresencaPresente ? "presente" : "ausente")}");
                var habilidade = r.Habilidade?.Resumo ?? r.Habilidade?.Descricao;
                if (!string.IsNullOrWhiteSpace(habilidade))
                    sb.Append($"; habilidade: {habilidade}");
                if (!string.IsNullOrWhiteSpace(r.Estrategia?.Descricao))
                    sb.Append($"; estratégia: {r.Estrategia.Descricao}");
                if (!string.IsNullOrWhiteSpace(r.Observacoes))
                    sb.Append($"; observações: {r.Observacoes}");
                sb.AppendLine();
            }
        }
        else
        {
            sb.AppendLine("Nenhum relato de atendimento registrado no período.");
        }
        sb.AppendLine();

        sb.AppendLine("=== Avaliações diagnósticas no período ===");
        if (insumos.AvaliacoesNoPeriodo.Count > 0)
        {
            foreach (var a in insumos.AvaliacoesNoPeriodo)
            {
                sb.AppendLine($"- {a.Titulo} ({a.DataAplicacao:dd/MM/yyyy})");
                foreach (var d in a.RegistrosDesempenho)
                {
                    if (!string.IsNullOrWhiteSpace(d.NivelRealizacao) || !string.IsNullOrWhiteSpace(d.Observacao))
                        sb.AppendLine($"  Desempenho: {d.NivelRealizacao} {d.Observacao}".Trim());
                }
            }
        }
        else
        {
            sb.AppendLine("Nenhuma avaliação diagnóstica registrada no período.");
        }
        sb.AppendLine();

        var elegivelEvolucao = dataInicio.AddMonths(3) <= dataFim;
        sb.AppendLine(elegivelEvolucao
            ? "Regra para a seção 'evolucao': período de 3 meses ou mais — divida os registros do período em início/meio/fim e compare a evolução observada entre essas fases."
            : "Regra para a seção 'evolucao': período menor que 3 meses — não segmente em fases, apenas sintetize a evolução observada no período como um todo.");
        sb.AppendLine();

        sb.AppendLine("Responda APENAS com um objeto JSON válido, sem markdown e sem texto fora do JSON, com exatamente estas chaves (cada uma como string ou null):");
        sb.AppendLine("contextualizacao, potencialidades, comunicacao, cognicao, academico, interacao, autonomia, motor_sensorial, barreiras, estrategias, evolucao, necessidades, encaminhamentos, conclusao.");
        sb.AppendLine("Se não houver dado suficiente na plataforma para uma seção, retorne null para aquela chave — nunca invente informação sobre o aluno que não esteja nos dados acima.");

        return sb.ToString();
    }

    // Retorna mensagem de erro (relatório permanece sem seções, retry liberado) ou null em caso de sucesso.
    private async Task<string?> GerarSecoesAsync(Relatorio relatorio, RelatorioInsumos insumos, int professorId)
    {
        var systemPrompt = await _promptService.BuscarConteudoAtivoAsync(TipoDocumentoIA.RelatorioPedagogico);
        if (string.IsNullOrWhiteSpace(systemPrompt))
            return "Nenhum prompt de sistema cadastrado para Relatório Pedagógico. Peça à gestora para configurar em Prompts de IA.";

        var promptUsuario = MontarPromptRelatorio(insumos, relatorio.DataInicio, relatorio.DataFim, relatorio.TipoPeriodo);

        string textoGerado;
        try
        {
            textoGerado = await _geradorTextoIA.GerarTextoAsync(systemPrompt, promptUsuario);
        }
        catch (InvalidOperationException ex)
        {
            await _geracaoLog.RegistrarAsync(professorId, TipoDocumentoIA.RelatorioPedagogico, relatorio.Id, relatorio.AlunoId, sucesso: false);
            return $"A geração por IA falhou: {ex.Message}";
        }

        var resultadoIA = ParseResultadoIA(textoGerado);
        if (resultadoIA == null)
        {
            await _geracaoLog.RegistrarAsync(professorId, TipoDocumentoIA.RelatorioPedagogico, relatorio.Id, relatorio.AlunoId, sucesso: false);
            return "A resposta da IA veio em formato inesperado.";
        }

        var agora = DateTime.UtcNow;
        foreach (var (chave, texto) in ParaDicionario(resultadoIA))
        {
            _db.RelatorioSecoes.Add(new RelatorioSecao
            {
                RelatorioId = relatorio.Id,
                SecaoChave = chave,
                TextoGerado = string.IsNullOrWhiteSpace(texto) ? null : texto.Trim(),
                GeradoEm = string.IsNullOrWhiteSpace(texto) ? null : agora,
            });
        }
        await _db.SaveChangesAsync();

        await _geracaoLog.RegistrarAsync(professorId, TipoDocumentoIA.RelatorioPedagogico, relatorio.Id, relatorio.AlunoId, sucesso: true);
        return null;
    }

    // Chamado pelo RelatorioGeracaoWorker, fora do ciclo de requisição HTTP — é aqui que a
    // chamada lenta de IA (14 seções numa chamada só) realmente acontece.
    public async Task ProcessarGeracaoAsync(int relatorioId)
    {
        var relatorio = await _db.Relatorios
            .Include(r => r.Aluno)
            .FirstOrDefaultAsync(r => r.Id == relatorioId);
        if (relatorio == null) return;

        var alunoNome = relatorio.Aluno?.NomeCompleto ?? "aluno";

        var insumos = await MontarInsumosAsync(relatorio.ProfessorId, relatorio.AlunoId, relatorio.DataInicio, relatorio.DataFim);
        if (insumos == null)
        {
            relatorio.Status = RelatorioStatus.ErroGeracao;
            relatorio.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            await _notificacaoService.CriarAsync(
                relatorio.ProfessorId,
                TipoNotificacao.RelatorioComErro,
                "Falha ao gerar relatório",
                $"Não foi possível gerar o relatório de {alunoNome}: aluno não encontrado ou sem permissão.",
                relatorio.Id);
            return;
        }

        var erro = await GerarSecoesAsync(relatorio, insumos, relatorio.ProfessorId);
        relatorio.Status = erro != null ? RelatorioStatus.ErroGeracao : RelatorioStatus.Rascunho;
        relatorio.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        if (erro != null)
        {
            await _notificacaoService.CriarAsync(
                relatorio.ProfessorId,
                TipoNotificacao.RelatorioComErro,
                "Falha ao gerar relatório",
                $"O relatório de {alunoNome} teve um problema na geração: {erro}",
                relatorio.Id);
        }
        else
        {
            await _notificacaoService.CriarAsync(
                relatorio.ProfessorId,
                TipoNotificacao.RelatorioGerado,
                "Relatório pronto",
                $"O relatório pedagógico de {alunoNome} foi gerado e está pronto para revisão.",
                relatorio.Id);
        }
    }

    private async Task<RelatorioBuscarDTO> MapToBuscarDtoAsync(int id)
    {
        var relatorio = await _db.Relatorios
            .Include(r => r.Aluno)
            .Include(r => r.Escola)
            .Include(r => r.Professor)
            .Include(r => r.Secoes)
            .AsNoTracking()
            .FirstAsync(r => r.Id == id);

        return new RelatorioBuscarDTO
        {
            Id = relatorio.Id,
            AlunoId = relatorio.AlunoId,
            AlunoNome = relatorio.Aluno?.NomeCompleto ?? "",
            AlunoDataNascimento = relatorio.Aluno?.DataNascimento,
            AlunoAno = relatorio.Aluno?.Ano,
            EscolaNomeInstituicao = relatorio.Escola?.NomeInstituicao,
            ProfessorNomeCompleto = relatorio.Professor?.NomeCompleto,
            AlunoFrequenciaSemanalAtendimento = relatorio.Aluno?.FrequenciaSemanalAtendimento,
            AlunoDuracaoAtendimentoMinutos = relatorio.Aluno?.DuracaoAtendimentoMinutos,
            AlunoTipoAtendimentoAee = relatorio.Aluno?.TipoAtendimentoAee,
            DataInicio = relatorio.DataInicio,
            DataFim = relatorio.DataFim,
            TipoPeriodo = relatorio.TipoPeriodo,
            Status = relatorio.Status,
            CreatedAt = relatorio.CreatedAt,
            UpdatedAt = relatorio.UpdatedAt,
            Secoes = relatorio.Secoes
                .OrderBy(s => (int)s.SecaoChave)
                .Select(s => new RelatorioSecaoDTO
                {
                    SecaoChave = s.SecaoChave,
                    TextoGerado = s.TextoGerado,
                    TextoEditado = s.TextoEditado,
                    NotasManuais = s.NotasManuais,
                    GeradoEm = s.GeradoEm,
                    EditadoEm = s.EditadoEm,
                })
                .ToList(),
        };
    }

    public async Task<ServiceResponse<RelatorioBuscarDTO>> CriarAsync(RelatorioCadastroDTO dto, Usuario usuario)
    {
        var resposta = new ServiceResponse<RelatorioBuscarDTO>();
        var professorId = usuario.ProfessorId ?? 0;
        if (professorId == 0)
        {
            resposta.SetFalha("Professor não identificado.");
            return resposta;
        }

        if (dto.DataInicio > dto.DataFim)
        {
            resposta.SetFalha("Data inicial não pode ser posterior à final.");
            return resposta;
        }

        try
        {
            // Só valida que o aluno existe e monta os insumos pra checagem de permissão —
            // os dados de verdade pro prompt são relidos em ProcessarGeracaoAsync, já que a
            // geração roda depois, em background (podem ter mudado entre o cadastro e o
            // processamento, o que é aceitável — reflete o estado mais atual).
            var insumos = await MontarInsumosAsync(professorId, dto.AlunoId, dto.DataInicio, dto.DataFim);
            if (insumos == null)
            {
                resposta.SetFalha("Aluno não encontrado ou sem permissão.");
                return resposta;
            }

            var relatorio = new Relatorio
            {
                AlunoId = dto.AlunoId,
                ProfessorId = professorId,
                EscolaId = insumos.Aluno.IdEscola,
                DataInicio = dto.DataInicio,
                DataFim = dto.DataFim,
                TipoPeriodo = dto.TipoPeriodo,
                Status = RelatorioStatus.Gerando,
            };
            _db.Relatorios.Add(relatorio);
            await _db.SaveChangesAsync();

            _geracaoQueue.Enfileirar(relatorio.Id);

            var dtoResultado = await MapToBuscarDtoAsync(relatorio.Id);
            resposta.AdicionaObjeto(dtoResultado);
            resposta.AdicionaMensagem("Relatório em geração. Você será avisado quando estiver pronto.");
            return resposta;
        }
        catch (Exception ex)
        {
            resposta.SetFalha("Erro ao criar relatório: " + ex.Message);
            return resposta;
        }
    }

    public async Task<ServiceResponse<RelatorioBuscarDTO>> GerarNovamenteAsync(int id, Usuario usuario)
    {
        var resposta = new ServiceResponse<RelatorioBuscarDTO>();
        var professorId = usuario.ProfessorId ?? 0;
        if (professorId == 0)
        {
            resposta.SetFalha("Professor não identificado.");
            return resposta;
        }

        var relatorio = await _db.Relatorios.FirstOrDefaultAsync(r => r.Id == id && r.ProfessorId == professorId);
        if (relatorio == null)
        {
            resposta.SetFalha("Relatório não encontrado.");
            return resposta;
        }

        var jaTemSecoes = await _db.RelatorioSecoes.AnyAsync(s => s.RelatorioId == id);
        if (jaTemSecoes)
        {
            resposta.SetFalha("Este relatório já foi gerado — edite as seções manualmente.");
            return resposta;
        }

        if (relatorio.Status == RelatorioStatus.Gerando)
        {
            resposta.SetFalha("Este relatório já está sendo gerado.");
            return resposta;
        }

        relatorio.Status = RelatorioStatus.Gerando;
        relatorio.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        _geracaoQueue.Enfileirar(relatorio.Id);

        var dtoResultado = await MapToBuscarDtoAsync(id);
        resposta.AdicionaObjeto(dtoResultado);
        resposta.AdicionaMensagem("Relatório em geração. Você será avisado quando estiver pronto.");
        return resposta;
    }

    public async Task<ServiceResponse<RelatorioBuscarDTO>> AtualizarSecaoAsync(
        int relatorioId,
        RelatorioSecaoAtualizarDTO dto,
        Usuario usuario)
    {
        var resposta = new ServiceResponse<RelatorioBuscarDTO>();
        var professorId = usuario.ProfessorId ?? 0;
        if (professorId == 0)
        {
            resposta.SetFalha("Professor não identificado.");
            return resposta;
        }

        var relatorio = await _db.Relatorios.FirstOrDefaultAsync(r => r.Id == relatorioId && r.ProfessorId == professorId);
        if (relatorio == null)
        {
            resposta.SetFalha("Relatório não encontrado.");
            return resposta;
        }

        if (relatorio.Status == RelatorioStatus.Finalizado)
        {
            resposta.SetFalha("Relatório finalizado — reabra para editar.");
            return resposta;
        }

        var secao = await _db.RelatorioSecoes
            .FirstOrDefaultAsync(s => s.RelatorioId == relatorioId && s.SecaoChave == dto.SecaoChave);
        if (secao == null)
        {
            resposta.SetFalha("Seção não encontrada — gere o relatório antes de editar.");
            return resposta;
        }

        secao.TextoEditado = string.IsNullOrWhiteSpace(dto.TextoEditado) ? null : dto.TextoEditado.Trim();
        secao.NotasManuais = string.IsNullOrWhiteSpace(dto.NotasManuais) ? null : dto.NotasManuais.Trim();
        secao.EditadoEm = DateTime.UtcNow;
        relatorio.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        resposta.AdicionaObjeto(await MapToBuscarDtoAsync(relatorioId));
        resposta.AdicionaMensagem("Seção atualizada.");
        return resposta;
    }

    public async Task<ServiceResponse<RelatorioBuscarDTO>> FinalizarAsync(int id, Usuario usuario)
    {
        var resposta = new ServiceResponse<RelatorioBuscarDTO>();
        var professorId = usuario.ProfessorId ?? 0;
        if (professorId == 0)
        {
            resposta.SetFalha("Professor não identificado.");
            return resposta;
        }

        var relatorio = await _db.Relatorios.FirstOrDefaultAsync(r => r.Id == id && r.ProfessorId == professorId);
        if (relatorio == null)
        {
            resposta.SetFalha("Relatório não encontrado.");
            return resposta;
        }

        if (!await _db.RelatorioSecoes.AnyAsync(s => s.RelatorioId == id))
        {
            resposta.SetFalha("Este relatório ainda não foi gerado.");
            return resposta;
        }

        relatorio.Status = RelatorioStatus.Finalizado;
        relatorio.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        resposta.AdicionaObjeto(await MapToBuscarDtoAsync(id));
        resposta.AdicionaMensagem("Relatório finalizado.");
        return resposta;
    }

    // Reabre pra edição sobrescrevendo o mesmo relatório — sem versionamento,
    // conforme decisão da cliente.
    public async Task<ServiceResponse<RelatorioBuscarDTO>> ReabrirAsync(int id, Usuario usuario)
    {
        var resposta = new ServiceResponse<RelatorioBuscarDTO>();
        var professorId = usuario.ProfessorId ?? 0;
        if (professorId == 0)
        {
            resposta.SetFalha("Professor não identificado.");
            return resposta;
        }

        var relatorio = await _db.Relatorios.FirstOrDefaultAsync(r => r.Id == id && r.ProfessorId == professorId);
        if (relatorio == null)
        {
            resposta.SetFalha("Relatório não encontrado.");
            return resposta;
        }

        relatorio.Status = RelatorioStatus.Rascunho;
        relatorio.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        resposta.AdicionaObjeto(await MapToBuscarDtoAsync(id));
        resposta.AdicionaMensagem("Relatório reaberto para edição.");
        return resposta;
    }

    // Cria um novo relatório (Rascunho, sem seções) pro mesmo aluno, com o período
    // deslocado pra logo após o período do relatório original (mesma duração). Não copia
    // texto — a professora aciona "Gerar novamente" quando quiser, sempre do zero via IA
    // (decisão de escopo registrada no doc da fase 6, seção "Ação Duplicar").
    public async Task<ServiceResponse<RelatorioBuscarDTO>> DuplicarAsync(int id, Usuario usuario)
    {
        var resposta = new ServiceResponse<RelatorioBuscarDTO>();
        var professorId = usuario.ProfessorId ?? 0;
        if (professorId == 0)
        {
            resposta.SetFalha("Professor não identificado.");
            return resposta;
        }

        var original = await _db.Relatorios.FirstOrDefaultAsync(r => r.Id == id && r.ProfessorId == professorId);
        if (original == null)
        {
            resposta.SetFalha("Relatório não encontrado.");
            return resposta;
        }

        var duracaoDias = original.DataFim.DayNumber - original.DataInicio.DayNumber;
        var novoInicio = original.DataFim.AddDays(1);
        var novoFim = novoInicio.AddDays(duracaoDias);

        var duplicado = new Relatorio
        {
            AlunoId = original.AlunoId,
            ProfessorId = professorId,
            EscolaId = original.EscolaId,
            DataInicio = novoInicio,
            DataFim = novoFim,
            TipoPeriodo = original.TipoPeriodo,
            Status = RelatorioStatus.Rascunho,
        };
        _db.Relatorios.Add(duplicado);
        await _db.SaveChangesAsync();

        resposta.AdicionaObjeto(await MapToBuscarDtoAsync(duplicado.Id));
        resposta.AdicionaMensagem("Relatório duplicado como base pro próximo período. Gere as seções quando quiser.");
        return resposta;
    }

    public async Task<ServiceResponse<RelatorioResumoDTO>> ListarAsync(
        Usuario usuario,
        int? alunoId,
        int? escolaId,
        RelatorioTipoPeriodo? tipoPeriodo,
        RelatorioStatus? status,
        DateOnly? dataInicio,
        DateOnly? dataFim)
    {
        var resposta = new ServiceResponse<RelatorioResumoDTO>();
        var professorId = usuario.ProfessorId ?? 0;
        if (professorId == 0)
        {
            resposta.SetFalha("Professor não identificado.");
            return resposta;
        }

        var q = _db.Relatorios
            .Include(r => r.Aluno)
            .Include(r => r.Escola)
            .AsNoTracking()
            .Where(r => r.ProfessorId == professorId);

        if (alunoId.HasValue)
            q = q.Where(r => r.AlunoId == alunoId.Value);

        if (escolaId.HasValue)
            q = q.Where(r => r.EscolaId == escolaId.Value);

        if (tipoPeriodo.HasValue)
            q = q.Where(r => r.TipoPeriodo == tipoPeriodo.Value);

        if (status.HasValue)
            q = q.Where(r => r.Status == status.Value);

        if (dataInicio.HasValue)
            q = q.Where(r => r.DataFim >= dataInicio.Value);

        if (dataFim.HasValue)
            q = q.Where(r => r.DataInicio <= dataFim.Value);

        var lista = await q
            .OrderByDescending(r => r.DataInicio)
            .ThenByDescending(r => r.Id)
            .ToListAsync();

        resposta.AdicionaObjetos(lista.Select(r => new RelatorioResumoDTO
        {
            Id = r.Id,
            AlunoId = r.AlunoId,
            AlunoNome = r.Aluno?.NomeCompleto ?? "",
            AlunoAno = r.Aluno?.Ano,
            EscolaId = r.EscolaId,
            EscolaNomeInstituicao = r.Escola?.NomeInstituicao,
            DataInicio = r.DataInicio,
            DataFim = r.DataFim,
            TipoPeriodo = r.TipoPeriodo,
            Status = r.Status,
            CreatedAt = r.CreatedAt,
            UpdatedAt = r.UpdatedAt,
        }));
        return resposta;
    }

    public async Task<ServiceResponse<RelatorioBuscarDTO>> BuscarPorIdAsync(int id, Usuario usuario)
    {
        var resposta = new ServiceResponse<RelatorioBuscarDTO>();
        var professorId = usuario.ProfessorId ?? 0;
        if (professorId == 0)
        {
            resposta.SetFalha("Professor não identificado.");
            return resposta;
        }

        var existe = await _db.Relatorios.AnyAsync(r => r.Id == id && r.ProfessorId == professorId);
        if (!existe)
        {
            resposta.SetFalha("Relatório não encontrado.");
            return resposta;
        }

        resposta.AdicionaObjeto(await MapToBuscarDtoAsync(id));
        return resposta;
    }
}
