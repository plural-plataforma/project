using System.Text.Json;
using api.DTOs.RelatoAtendimento;
using api.Models;
using api.Responses;
using api.Services.IA;
using Data;
using Microsoft.EntityFrameworkCore;

namespace api.Services;

public class RelatoAtendimentoService
{
    private static readonly JsonSerializerOptions JsonLista = new()
    {
        PropertyNameCaseInsensitive = true,
        WriteIndented = false,
    };

    private readonly AppDbContext _db;
    private readonly PromptSistemaIAService _promptService;
    private readonly IGeradorTextoIA _geradorTextoIA;

    public RelatoAtendimentoService(AppDbContext db, PromptSistemaIAService promptService, IGeradorTextoIA geradorTextoIA)
    {
        _db = db;
        _promptService = promptService;
        _geradorTextoIA = geradorTextoIA;
    }

    private static string SerializarLista(IReadOnlyCollection<string>? itens)
    {
        var lista = (itens ?? []).Where(static s => !string.IsNullOrWhiteSpace(s)).Select(static s => s.Trim()).ToList();
        return JsonSerializer.Serialize(lista, JsonLista);
    }

    private static List<string> DeserializarLista(string? json)
    {
        if (string.IsNullOrWhiteSpace(json))
            return [];
        try
        {
            return JsonSerializer.Deserialize<List<string>>(json, JsonLista) ?? [];
        }
        catch
        {
            return [];
        }
    }

    private static RelatoAtendimentoBuscarDTO MapToBuscarDto(RelatoAtendimento r) =>
        new()
        {
            Id = r.Id,
            AlunoId = r.AlunoId,
            AlunoNome = r.Aluno?.NomeCompleto ?? "",
            PlanejamentoId = r.PlanejamentoId,
            PlanejamentoApelido = r.Planejamento?.Apelido,
            DataSessao = r.DataSessao,
            PresencaPresente = r.PresencaPresente,
            TipoOcorrencia = r.TipoOcorrencia,
            HabilidadeId = r.HabilidadeId,
            HabilidadeResumo = r.Habilidade != null ? (r.Habilidade.Resumo ?? r.Habilidade.Descricao) : null,
            EstrategiaId = r.EstrategiaId,
            EstrategiaDescricao = r.Estrategia?.Descricao,
            Observacoes = r.Observacoes,
            Avancos = DeserializarLista(r.AvancosJson),
            Dificuldades = DeserializarLista(r.DificuldadesJson),
            TextoGeradoIA = r.TextoGeradoIA,
        };

    /// <returns>Mensagem de erro ou null se válido.</returns>
    private async Task<string?> ValidarNegocioAsync(
        int professorId,
        int alunoId,
        int? planejamentoId,
        DateOnly dataSessao,
        int? habilidadeId,
        int? estrategiaId,
        bool presencaPresente,
        RelatoTipoOcorrencia tipoOcorrencia,
        string? observacoes)
    {
        if (!presencaPresente && string.IsNullOrWhiteSpace(observacoes))
            return "Informe observações quando o aluno não esteve presente.";

        if (tipoOcorrencia != RelatoTipoOcorrencia.Normal && string.IsNullOrWhiteSpace(observacoes))
            return "Informe observações quando a ocorrência não for sessão normal (cancelada ou reagendada).";

        var aluno = await _db.Alunos.AsNoTracking()
            .FirstOrDefaultAsync(a => a.Id == alunoId && a.IdProfessor == professorId);
        if (aluno == null)
            return "Aluno não encontrado ou sem permissão.";

        if (!planejamentoId.HasValue)
        {
            if (habilidadeId.HasValue)
            {
                var existeH = await _db.Habilidades.AnyAsync(h => h.Id == habilidadeId.Value);
                if (!existeH)
                    return "Habilidade não encontrada.";
            }

            if (estrategiaId.HasValue)
            {
                var existeE = await _db.Estrategias.AnyAsync(e => e.Id == estrategiaId.Value);
                if (!existeE)
                    return "Estratégia não encontrada.";
            }

            return null;
        }

        var plano = await _db.Planejamentos
            .AsNoTracking()
            .FirstOrDefaultAsync(p =>
                p.ID == planejamentoId.Value &&
                p.IdProfessor == professorId);

        if (plano == null)
            return "PAEE não encontrado ou sem permissão.";

        var alunoNoPlano = await _db.AlunosXPlanejamentos
            .AnyAsync(x => x.PlanejamentoId == planejamentoId.Value && x.AlunoId == alunoId);
        if (!alunoNoPlano)
            return "O aluno não está vinculado ao PAEE informado.";

        if (dataSessao < plano.DataInicio || dataSessao > plano.DataFim)
            return "A data da sessão precisa estar dentro do período do PAEE escolhido.";

        if (habilidadeId.HasValue)
        {
            var ok = await _db.HabilidadesXPlanejamentos
                .AnyAsync(x =>
                    x.PlanejamentoId == planejamentoId.Value &&
                    x.HabilidadeId == habilidadeId.Value);
            if (!ok)
                return "A habilidade informada não faz parte deste PAEE.";
        }

        if (estrategiaId.HasValue)
        {
            var ok = await _db.EstrategiasXPlanejamentos
                .AnyAsync(x =>
                    x.PlanejamentoId == planejamentoId.Value &&
                    x.EstrategiaId == estrategiaId.Value);
            if (!ok)
                return "A estratégia informada não faz parte deste PAEE.";
        }

        return null;
    }

    private IQueryable<RelatoAtendimento> BaseQueryProfessor(int professorId) =>
        _db.RelatosAtendimento
            .Include(r => r.Aluno)
            .Include(r => r.Planejamento)
            .Include(r => r.Habilidade)
            .Include(r => r.Estrategia)
            .Where(r => r.Aluno!.IdProfessor == professorId);

    public async Task<ServiceResponse<RelatoAtendimentoBuscarDTO>> Cadastrar(
        RelatoAtendimentoCadastroDTO dto,
        Usuario usuario)
    {
        var resposta = new ServiceResponse<RelatoAtendimentoBuscarDTO>();
        var professorId = usuario.ProfessorId ?? 0;
        if (professorId == 0)
        {
            resposta.SetFalha("Professor não identificado.");
            return resposta;
        }

        var erro = await ValidarNegocioAsync(
            professorId,
            dto.AlunoId,
            dto.PlanejamentoId,
            dto.DataSessao,
            dto.HabilidadeId,
            dto.EstrategiaId,
            dto.PresencaPresente,
            dto.TipoOcorrencia,
            dto.Observacoes);
        if (erro != null)
        {
            resposta.SetFalha(erro);
            return resposta;
        }

        try
        {
            var ent = new RelatoAtendimento
            {
                AlunoId = dto.AlunoId,
                PlanejamentoId = dto.PlanejamentoId,
                DataSessao = dto.DataSessao,
                PresencaPresente = dto.PresencaPresente,
                TipoOcorrencia = dto.TipoOcorrencia,
                HabilidadeId = dto.HabilidadeId,
                EstrategiaId = dto.EstrategiaId,
                Observacoes = dto.Observacoes?.Trim(),
                AvancosJson = SerializarLista(dto.Avancos),
                DificuldadesJson = SerializarLista(dto.Dificuldades),
            };

            _db.RelatosAtendimento.Add(ent);
            await _db.SaveChangesAsync();

            var carregado = await BaseQueryProfessor(professorId).FirstAsync(r => r.Id == ent.Id);

            resposta.AdicionaObjeto(MapToBuscarDto(carregado));
            resposta.AdicionaMensagem("Relato registrado.");
            return resposta;
        }
        catch (Exception ex)
        {
            resposta.SetFalha(ex.Message);
            return resposta;
        }
    }

    public async Task<ServiceResponse<RelatoAtendimentoBuscarDTO>> Atualizar(
        RelatoAtendimentoAtualizarDTO dto,
        Usuario usuario)
    {
        var resposta = new ServiceResponse<RelatoAtendimentoBuscarDTO>();
        var professorId = usuario.ProfessorId ?? 0;
        if (professorId == 0)
        {
            resposta.SetFalha("Professor não identificado.");
            return resposta;
        }

        var ent = await BaseQueryProfessor(professorId).FirstOrDefaultAsync(r => r.Id == dto.Id);
        if (ent == null)
        {
            resposta.SetFalha("Relato não encontrado.");
            return resposta;
        }

        var erro = await ValidarNegocioAsync(
            professorId,
            ent.AlunoId,
            dto.PlanejamentoId,
            dto.DataSessao,
            dto.HabilidadeId,
            dto.EstrategiaId,
            dto.PresencaPresente,
            dto.TipoOcorrencia,
            dto.Observacoes);
        if (erro != null)
        {
            resposta.SetFalha(erro);
            return resposta;
        }

        try
        {
            ent.PlanejamentoId = dto.PlanejamentoId;
            ent.DataSessao = dto.DataSessao;
            ent.PresencaPresente = dto.PresencaPresente;
            ent.TipoOcorrencia = dto.TipoOcorrencia;
            ent.HabilidadeId = dto.HabilidadeId;
            ent.EstrategiaId = dto.EstrategiaId;
            ent.Observacoes = dto.Observacoes?.Trim();
            ent.AvancosJson = SerializarLista(dto.Avancos);
            ent.DificuldadesJson = SerializarLista(dto.Dificuldades);
            ent.TextoGeradoIA = dto.TextoGeradoIA?.Trim() is { Length: > 0 } texto ? texto : null;

            await _db.SaveChangesAsync();

            var carregado = await BaseQueryProfessor(professorId).FirstAsync(r => r.Id == ent.Id);

            resposta.AdicionaObjeto(MapToBuscarDto(carregado));
            resposta.AdicionaMensagem("Relato atualizado.");
            return resposta;
        }
        catch (Exception ex)
        {
            resposta.SetFalha(ex.Message);
            return resposta;
        }
    }

    public async Task<ServiceResponse<RelatoAtendimentoBuscarDTO>> GerarTextoIAAsync(int id, Usuario usuario)
    {
        var r = new ServiceResponse<RelatoAtendimentoBuscarDTO>();
        var professorId = usuario.ProfessorId ?? 0;
        if (professorId == 0)
        {
            r.SetFalha("Professor não identificado.");
            return r;
        }

        try
        {
            var ent = await BaseQueryProfessor(professorId).FirstOrDefaultAsync(x => x.Id == id);
            if (ent == null)
            {
                r.SetFalha("Relato não encontrado.");
                return r;
            }

            var systemPrompt = await _promptService.BuscarConteudoAtivoAsync(TipoDocumentoIA.RelatoAtendimento);
            if (string.IsNullOrWhiteSpace(systemPrompt))
            {
                r.SetFalha("Nenhum prompt de sistema cadastrado para Relato de Atendimento. Peça à gestora para configurar em Prompts de IA.");
                return r;
            }

            var promptUsuario = MontarPromptRelato(ent);

            string textoGerado;
            try
            {
                textoGerado = await _geradorTextoIA.GerarTextoAsync(systemPrompt, promptUsuario);
            }
            catch (InvalidOperationException ex)
            {
                r.SetFalha(ex.Message);
                return r;
            }

            ent.TextoGeradoIA = textoGerado.Trim();
            await _db.SaveChangesAsync();

            r.AdicionaObjeto(MapToBuscarDto(ent));
            r.AdicionaMensagem("Texto gerado por IA. Revise antes de usar em documentos oficiais.");
            return r;
        }
        catch (Exception ex)
        {
            r.SetFalha($"Erro ao gerar texto do relato via IA: {ex.Message}");
            return r;
        }
    }

    private static string MontarPromptRelato(RelatoAtendimento r)
    {
        var nome = r.Aluno?.NomeCompleto?.Trim() ?? "Aluno(a)";
        var dataTxt = r.DataSessao.ToString("dd/MM/yyyy");

        var sb = new System.Text.StringBuilder();
        sb.AppendLine("Redija o relato desta sessão de atendimento a partir destes dados (siga o formato definido no system prompt):");
        sb.AppendLine();
        sb.AppendLine($"Estudante: {nome}");
        sb.AppendLine($"Data da sessão: {dataTxt}");
        sb.AppendLine($"Presença: {(r.PresencaPresente ? "presente" : "ausente")}");
        sb.AppendLine($"Ocorrência: {r.TipoOcorrencia}");

        if (r.Planejamento != null)
            sb.AppendLine($"PAEE vinculado: {r.Planejamento.Apelido}");

        var habilidade = r.Habilidade != null ? (r.Habilidade.Resumo ?? r.Habilidade.Descricao) : null;
        if (!string.IsNullOrWhiteSpace(habilidade))
            sb.AppendLine($"Habilidade trabalhada: {habilidade}");

        if (!string.IsNullOrWhiteSpace(r.Estrategia?.Descricao))
            sb.AppendLine($"Estratégia utilizada: {r.Estrategia.Descricao.Trim()}");

        if (!string.IsNullOrWhiteSpace(r.Observacoes))
            sb.AppendLine($"Observações da professora: {r.Observacoes.Trim()}");

        var avancos = DeserializarLista(r.AvancosJson);
        sb.AppendLine(avancos.Count > 0
            ? $"Avanços observados: {string.Join("; ", avancos)}"
            : "Nenhum avanço registrado nesta sessão.");

        var dificuldades = DeserializarLista(r.DificuldadesJson);
        sb.AppendLine(dificuldades.Count > 0
            ? $"Dificuldades observadas: {string.Join("; ", dificuldades)}"
            : "Nenhuma dificuldade registrada nesta sessão.");

        return sb.ToString();
    }

    public async Task<ServiceResponse<bool>> Excluir(int id, Usuario usuario)
    {
        var resposta = new ServiceResponse<bool>();
        var professorId = usuario.ProfessorId ?? 0;
        if (professorId == 0)
        {
            resposta.SetFalha("Professor não identificado.");
            return resposta;
        }

        var ent = await BaseQueryProfessor(professorId).FirstOrDefaultAsync(r => r.Id == id);
        if (ent == null)
        {
            resposta.SetFalha("Relato não encontrado.");
            return resposta;
        }

        _db.RelatosAtendimento.Remove(ent);
        await _db.SaveChangesAsync();
        resposta.AdicionaObjeto(true);
        resposta.AdicionaMensagem("Relato excluído.");
        return resposta;
    }

    public async Task<ServiceResponse<RelatoAtendimentoBuscarDTO>> ListarAsync(
        Usuario usuario,
        int? alunoId,
        DateOnly? dataInicio,
        DateOnly? dataFim)
    {
        var resposta = new ServiceResponse<RelatoAtendimentoBuscarDTO>();
        var professorId = usuario.ProfessorId ?? 0;
        if (professorId == 0)
        {
            resposta.SetFalha("Professor não identificado.");
            return resposta;
        }

        var q = BaseQueryProfessor(professorId);
        if (alunoId.HasValue)
            q = q.Where(r => r.AlunoId == alunoId.Value);

        if (dataInicio.HasValue)
            q = q.Where(r => r.DataSessao >= dataInicio.Value);

        if (dataFim.HasValue)
            q = q.Where(r => r.DataSessao <= dataFim.Value);

        var lista = await q
            .OrderByDescending(r => r.DataSessao)
            .ThenByDescending(r => r.Id)
            .ToListAsync();

        resposta.AdicionaObjetos(lista.Select(MapToBuscarDto));
        return resposta;
    }

    public async Task<ServiceResponse<RelatoAtendimentoBuscarDTO>> RelatorioConsolidadoAsync(
        Usuario usuario,
        DateOnly dataInicio,
        DateOnly dataFim,
        int? alunoId)
    {
        var resposta = new ServiceResponse<RelatoAtendimentoBuscarDTO>();
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

        var q = BaseQueryProfessor(professorId)
            .Where(r => r.DataSessao >= dataInicio && r.DataSessao <= dataFim);

        if (alunoId.HasValue)
            q = q.Where(r => r.AlunoId == alunoId.Value);

        var lista = await q
            .OrderBy(r => r.DataSessao)
            .ThenBy(r => r.Aluno!.NomeCompleto)
            .ThenBy(r => r.Id)
            .ToListAsync();

        resposta.AdicionaObjetos(lista.Select(MapToBuscarDto));
        return resposta;
    }

    public async Task<ServiceResponse<RelatoSugestoesMesDTO>> SugestoesMesAsync(
        Usuario usuario,
        int alunoId,
        int ano,
        int mes)
    {
        var resposta = new ServiceResponse<RelatoSugestoesMesDTO>();
        var professorId = usuario.ProfessorId ?? 0;
        if (professorId == 0)
        {
            resposta.SetFalha("Professor não identificado.");
            return resposta;
        }

        if (mes is < 1 or > 12)
        {
            resposta.SetFalha("Mês inválido.");
            return resposta;
        }

        try
        {
            var ini = new DateOnly(ano, mes, 1);
            var fim = ini.AddMonths(1).AddDays(-1);

            var aluno = await _db.Alunos.AsNoTracking()
                .FirstOrDefaultAsync(a => a.Id == alunoId && a.IdProfessor == professorId);
            if (aluno == null)
            {
                resposta.SetFalha("Aluno não encontrado.");
                return resposta;
            }

            var dias = PaeeDatasSugeridasGerador.DeserializarDiasDaSemana(aluno.DiasSemanaAtendimentoJson);
            var todas = PaeeDatasSugeridasGerador.Sugerir(ini, fim, dias, aluno.FrequenciaSemanalAtendimento).ToList();

            var comRelato = await _db.RelatosAtendimento
                .Where(r => r.AlunoId == alunoId && r.DataSessao >= ini && r.DataSessao <= fim)
                .Select(r => r.DataSessao)
                .Distinct()
                .ToListAsync();

            var resultado = new RelatoSugestoesMesDTO
            {
                Ano = ano,
                Mes = mes,
                DatasSugeridas = todas,
                DatasComRelatoRegistrado = comRelato.OrderBy(d => d).ToList(),
            };

            resposta.AdicionaObjeto(resultado);
            return resposta;
        }
        catch (Exception ex)
        {
            resposta.SetFalha(ex.Message);
            return resposta;
        }
    }
}
