using api.DTOs.EstudoDeCaso;
using api.Models;
using api.Responses;
using Data;
using Microsoft.EntityFrameworkCore;

namespace api.Services;

public class EstudoDeCasoService
{
    private readonly AppDbContext _db;

    public EstudoDeCasoService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<ServiceResponse<EstudoDeCasoEixoCatalogoDTO>> ListarEixosCatalogoAsync()
    {
        var r = new ServiceResponse<EstudoDeCasoEixoCatalogoDTO>();
        try
        {
            var lista = await _db.EstudoCasoEixosCatalogo
                .AsNoTracking()
                .OrderBy(e => e.OrdemExibicao)
                .ThenBy(e => e.Id)
                .Select(e => new EstudoDeCasoEixoCatalogoDTO
                {
                    Id = e.Id,
                    Codigo = e.Codigo,
                    Rotulo = e.Rotulo,
                    DescricaoHint = e.DescricaoHint,
                    OrdemExibicao = e.OrdemExibicao,
                })
                .ToListAsync();

            r.ListaObjetos = lista;
            r.Sucesso = true;
            return r;
        }
        catch (Exception ex)
        {
            r.SetFalha($"Erro ao listar eixos: {ex.Message}");
            return r;
        }
    }

    public async Task<ServiceResponse<EstudoDeCasoListaItemDTO>> ListarPorAlunoAsync(int alunoId, Usuario usuario)
    {
        var r = new ServiceResponse<EstudoDeCasoListaItemDTO>();
        var pid = usuario.ProfessorId ?? 0;
        if (pid == 0)
        {
            r.SetFalha("Professor não vinculado ao usuário.");
            return r;
        }

        var alunoOk = await _db.Alunos.AsNoTracking().AnyAsync(a => a.Id == alunoId && a.IdProfessor == pid);
        if (!alunoOk)
        {
            r.SetFalha("Aluno não encontrado ou sem permissão.");
            return r;
        }

        try
        {
            var lista = await _db.EstudosCaso
                .AsNoTracking()
                .Where(c => c.AlunoId == alunoId && c.ProfessorId == pid)
                .OrderByDescending(c => c.UpdatedAt)
                .Select(c => new EstudoDeCasoListaItemDTO
                {
                    Id = c.Id,
                    Titulo = c.Titulo,
                    UpdatedAt = c.UpdatedAt,
                    PossuiTextoSimulado = c.TextoSimulado != null && c.TextoSimulado.Trim().Length > 0,
                })
                .ToListAsync();

            r.ListaObjetos = lista;
            r.Sucesso = true;
            return r;
        }
        catch (Exception ex)
        {
            r.SetFalha($"Erro ao listar estudos de caso: {ex.Message}");
            return r;
        }
    }

    public async Task<ServiceResponse<EstudoDeCasoDetalheDTO>> BuscarPorIdAsync(int id, Usuario usuario)
    {
        var r = new ServiceResponse<EstudoDeCasoDetalheDTO>();
        var pid = usuario.ProfessorId ?? 0;
        if (pid == 0)
        {
            r.SetFalha("Professor não vinculado ao usuário.");
            return r;
        }

        try
        {
            var entity = await _db.EstudosCaso
                .AsNoTracking()
                .Include(c => c.Aluno)
                .Include(c => c.ItensEixo)
                .ThenInclude(i => i.CatalogoEixo)
                .FirstOrDefaultAsync(c => c.Id == id && c.ProfessorId == pid);

            if (entity == null)
            {
                r.SetFalha("Estudo de caso não encontrado.");
                return r;
            }

            r.AdicionaObjeto(MapearDetalhe(entity));
            r.Sucesso = true;
            return r;
        }
        catch (Exception ex)
        {
            r.SetFalha($"Erro ao buscar estudo de caso: {ex.Message}");
            return r;
        }
    }

    public async Task<ServiceResponse<EstudoDeCasoDetalheDTO>> CadastrarAsync(EstudoDeCasoCadastroDTO dto, Usuario usuario)
    {
        var r = new ServiceResponse<EstudoDeCasoDetalheDTO>();
        var pid = usuario.ProfessorId ?? 0;
        if (pid == 0)
        {
            r.SetFalha("Professor não vinculado ao usuário.");
            return r;
        }

        if (string.IsNullOrWhiteSpace(dto.Titulo) || string.IsNullOrWhiteSpace(dto.ContextoSituacao))
        {
            r.SetFalha("Título e contexto da situação são obrigatórios.");
            return r;
        }

        var aluno = await _db.Alunos.FirstOrDefaultAsync(a => a.Id == dto.AlunoId && a.IdProfessor == pid);
        if (aluno == null)
        {
            r.SetFalha("Aluno não encontrado ou sem permissão.");
            return r;
        }

        var idsEixo = dto.ItensEixo.Select(i => i.EixoCatalogoId).Distinct().ToList();
        if (idsEixo.Count == 0)
        {
            r.SetFalha("Selecione pelo menos um eixo pedagógico.");
            return r;
        }

        var existentes = await _db.EstudoCasoEixosCatalogo.Where(e => idsEixo.Contains(e.Id)).Select(e => e.Id).ToListAsync();
        if (existentes.Count != idsEixo.Count)
        {
            r.SetFalha("Um ou mais eixos informados são inválidos.");
            return r;
        }

        try
        {
            var now = DateTime.UtcNow;
            var caso = new EstudoDeCaso
            {
                AlunoId = dto.AlunoId,
                ProfessorId = pid,
                Titulo = dto.Titulo.Trim(),
                ContextoSituacao = dto.ContextoSituacao.Trim(),
                TextoSimulado = null,
                CreatedAt = now,
                UpdatedAt = now,
            };

            foreach (var item in dto.ItensEixo.GroupBy(i => i.EixoCatalogoId).Select(g => g.First()))
            {
                caso.ItensEixo.Add(new EstudoDeCasoItemEixo
                {
                    EixoCatalogoId = item.EixoCatalogoId,
                    Anotacao = string.IsNullOrWhiteSpace(item.Anotacao) ? null : item.Anotacao.Trim(),
                });
            }

            _db.EstudosCaso.Add(caso);
            await _db.SaveChangesAsync();

            var carregado = await _db.EstudosCaso
                .AsNoTracking()
                .Include(c => c.Aluno)
                .Include(c => c.ItensEixo)
                .ThenInclude(i => i.CatalogoEixo)
                .FirstAsync(c => c.Id == caso.Id);

            r.AdicionaObjeto(MapearDetalhe(carregado));
            r.AdicionaMensagem("Estudo de caso registrado com sucesso.");
            r.Sucesso = true;
            return r;
        }
        catch (Exception ex)
        {
            r.SetFalha($"Erro ao salvar estudo de caso: {ex.Message}");
            return r;
        }
    }

    public async Task<ServiceResponse<EstudoDeCasoDetalheDTO>> GerarTextoSimuladoAsync(int id, Usuario usuario)
    {
        var r = new ServiceResponse<EstudoDeCasoDetalheDTO>();
        var pid = usuario.ProfessorId ?? 0;
        if (pid == 0)
        {
            r.SetFalha("Professor não vinculado ao usuário.");
            return r;
        }

        try
        {
            var entity = await _db.EstudosCaso
                .Include(c => c.Aluno)
                .Include(c => c.ItensEixo)
                .ThenInclude(i => i.CatalogoEixo)
                .FirstOrDefaultAsync(c => c.Id == id && c.ProfessorId == pid);

            if (entity == null)
            {
                r.SetFalha("Estudo de caso não encontrado.");
                return r;
            }

            entity.TextoSimulado = MontarTextoSimulado(entity);
            entity.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            var dto = MapearDetalhe(entity);
            r.AdicionaObjeto(dto);
            r.AdicionaMensagem("Texto simulado gerado. Revise antes de usar em documentos oficiais.");
            r.Sucesso = true;
            return r;
        }
        catch (Exception ex)
        {
            r.SetFalha($"Erro ao gerar texto simulado: {ex.Message}");
            return r;
        }
    }

    private static EstudoDeCasoDetalheDTO MapearDetalhe(EstudoDeCaso entity)
    {
        return new EstudoDeCasoDetalheDTO
        {
            Id = entity.Id,
            AlunoId = entity.AlunoId,
            AlunoNomeCompleto = entity.Aluno?.NomeCompleto ?? "",
            Titulo = entity.Titulo,
            ContextoSituacao = entity.ContextoSituacao,
            TextoSimulado = entity.TextoSimulado,
            CreatedAt = entity.CreatedAt,
            UpdatedAt = entity.UpdatedAt,
            ItensEixo = entity.ItensEixo
                .OrderBy(i => i.CatalogoEixo?.OrdemExibicao ?? 0)
                .Select(i => new EstudoDeCasoItemDetalheDTO
                {
                    EixoCatalogoId = i.EixoCatalogoId,
                    Anotacao = i.Anotacao,
                    CodigoEixo = i.CatalogoEixo?.Codigo ?? "",
                    RotuloEixo = i.CatalogoEixo?.Rotulo ?? "",
                })
                .ToList(),
        };
    }

    private static string MontarTextoSimulado(EstudoDeCaso entity)
    {
        var nome = entity.Aluno?.NomeCompleto?.Trim() ?? "Aluno";
        var idadeTxt = "";
        if (entity.Aluno?.DataNascimento is { } dn)
        {
            var hoje = DateOnly.FromDateTime(DateTime.UtcNow);
            var anos = hoje.Year - dn.Year - (hoje.DayOfYear < dn.DayOfYear ? 1 : 0);
            if (anos >= 0 && anos < 130)
                idadeTxt = $" Idade cronológica aproximada: {anos} anos.";
        }

        var sb = new System.Text.StringBuilder();
        sb.AppendLine("*** TEXTO SIMULADO (RASCUNHO AUTOMÁTICO — REVISÃO PEDAGÓGICA OBRIGATÓRIA) ***");
        sb.AppendLine();
        sb.AppendLine($"Estudo de caso — {entity.Titulo.Trim()}");
        sb.AppendLine($"Aluno(a): {nome}.{idadeTxt}");
        sb.AppendLine($"Gerado em (UTC): {DateTime.UtcNow:yyyy-MM-dd HH:mm}");
        sb.AppendLine();
        sb.AppendLine("--- Contexto relatado pela equipe ---");
        sb.AppendLine(entity.ContextoSituacao.Trim());
        sb.AppendLine();
        sb.AppendLine("--- Recorte por eixos (orientação para PAEE) ---");

        foreach (var item in entity.ItensEixo.OrderBy(i => i.CatalogoEixo?.OrdemExibicao ?? 0))
        {
            var rotulo = item.CatalogoEixo?.Rotulo ?? $"Eixo #{item.EixoCatalogoId}";
            sb.AppendLine();
            sb.AppendLine($"• {rotulo}");
            if (!string.IsNullOrWhiteSpace(item.CatalogoEixo?.DescricaoHint))
                sb.AppendLine($"  Referência: {item.CatalogoEixo.DescricaoHint.Trim()}");
            if (!string.IsNullOrWhiteSpace(item.Anotacao))
                sb.AppendLine($"  Observação registrada: {item.Anotacao.Trim()}");
            sb.AppendLine($"  Sugestão de análise (simulada): relacionar indicadores observados em sala/atendimento com demandas de mediação e metas próximas do ciclo PAEE, priorizando coerência com o perfil do(a) estudante.");
        }

        sb.AppendLine();
        sb.AppendLine("--- Encerramento ---");
        sb.AppendLine("Este texto não substitui avaliação clínica nem parecer especializado: utilize como ponto de partida para discussão em equipe e adequação ao currículo.");

        return sb.ToString();
    }
}
