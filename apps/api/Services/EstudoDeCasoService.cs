using api.Constants;
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
            var aluno = await _db.Alunos.AsNoTracking()
                .Where(a => a.Id == alunoId)
                .Select(a => new { a.NomeCompleto })
                .FirstAsync();

            var lista = await _db.EstudosCaso
                .AsNoTracking()
                .Where(c => c.AlunoId == alunoId && c.ProfessorId == pid)
                .OrderByDescending(c => c.UpdatedAt)
                .Select(c => new EstudoDeCasoListaItemDTO
                {
                    Id = c.Id,
                    AlunoId = alunoId,
                    AlunoNomeCompleto = aluno.NomeCompleto,
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

    public async Task<ServiceResponse<EstudoDeCasoListaItemDTO>> ListarTodosAsync(Usuario usuario)
    {
        var r = new ServiceResponse<EstudoDeCasoListaItemDTO>();
        var pid = usuario.ProfessorId ?? 0;
        if (pid == 0)
        {
            r.SetFalha("Professor não vinculado ao usuário.");
            return r;
        }

        try
        {
            var lista = await _db.EstudosCaso
                .AsNoTracking()
                .Where(c => c.ProfessorId == pid)
                .OrderByDescending(c => c.UpdatedAt)
                .Select(c => new EstudoDeCasoListaItemDTO
                {
                    Id = c.Id,
                    AlunoId = c.AlunoId,
                    AlunoNomeCompleto = c.Aluno.NomeCompleto,
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

        var existentes = await _db.EstudoCasoEixosCatalogo.Where(e => idsEixo.Contains(e.Id)).Select(e => e.Id).ToListAsync();
        if (existentes.Count != idsEixo.Count)
        {
            r.SetFalha("Um ou mais eixos informados são inválidos.");
            return r;
        }

        var (okTodos, errTodos) = await ValidarTodosEixosDoCatalogoAsync(idsEixo);
        if (!okTodos)
        {
            r.SetFalha(errTodos);
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

    public async Task<ServiceResponse<EstudoDeCasoDetalheDTO>> AtualizarAsync(int id, EstudoDeCasoAtualizacaoDTO dto, Usuario usuario)
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

        var idsEixo = dto.ItensEixo.Select(i => i.EixoCatalogoId).Distinct().ToList();

        var existentes = await _db.EstudoCasoEixosCatalogo.Where(e => idsEixo.Contains(e.Id)).Select(e => e.Id).ToListAsync();
        if (existentes.Count != idsEixo.Count)
        {
            r.SetFalha("Um ou mais eixos informados são inválidos.");
            return r;
        }

        var (okTodosAtual, errTodosAtual) = await ValidarTodosEixosDoCatalogoAsync(idsEixo);
        if (!okTodosAtual)
        {
            r.SetFalha(errTodosAtual);
            return r;
        }

        try
        {
            var caso = await _db.EstudosCaso
                .Include(c => c.ItensEixo)
                .FirstOrDefaultAsync(c => c.Id == id && c.ProfessorId == pid);

            if (caso == null)
            {
                r.SetFalha("Estudo de caso não encontrado.");
                return r;
            }

            var now = DateTime.UtcNow;
            caso.Titulo = dto.Titulo.Trim();
            caso.ContextoSituacao = dto.ContextoSituacao.Trim();
            caso.TextoSimulado = null;
            caso.UpdatedAt = now;

            _db.EstudoCasoItensEixo.RemoveRange(caso.ItensEixo);
            caso.ItensEixo.Clear();

            foreach (var item in dto.ItensEixo.GroupBy(i => i.EixoCatalogoId).Select(g => g.First()))
            {
                caso.ItensEixo.Add(new EstudoDeCasoItemEixo
                {
                    EixoCatalogoId = item.EixoCatalogoId,
                    Anotacao = string.IsNullOrWhiteSpace(item.Anotacao) ? null : item.Anotacao.Trim(),
                });
            }

            await _db.SaveChangesAsync();

            var carregado = await _db.EstudosCaso
                .AsNoTracking()
                .Include(c => c.Aluno)
                .Include(c => c.ItensEixo)
                .ThenInclude(i => i.CatalogoEixo)
                .FirstAsync(c => c.Id == caso.Id);

            r.AdicionaObjeto(MapearDetalhe(carregado));
            r.AdicionaMensagem("Estudo de caso atualizado. Gere novamente o rascunho simulado se precisar.");
            r.Sucesso = true;
            return r;
        }
        catch (Exception ex)
        {
            r.SetFalha($"Erro ao atualizar estudo de caso: {ex.Message}");
            return r;
        }
    }

    public async Task<ServiceResponse<bool>> ExcluirAsync(int id, Usuario usuario)
    {
        var r = new ServiceResponse<bool>();
        var pid = usuario.ProfessorId ?? 0;
        if (pid == 0)
        {
            r.SetFalha("Professor não vinculado ao usuário.");
            return r;
        }

        try
        {
            var caso = await _db.EstudosCaso.FirstOrDefaultAsync(c => c.Id == id && c.ProfessorId == pid);
            if (caso == null)
            {
                r.SetFalha("Estudo de caso não encontrado.");
                return r;
            }

            _db.EstudosCaso.Remove(caso);
            await _db.SaveChangesAsync();

            r.Sucesso = true;
            r.AdicionaObjeto(true);
            r.AdicionaMensagem("Estudo de caso excluído com sucesso.");
            return r;
        }
        catch (Exception ex)
        {
            r.SetFalha($"Erro ao excluir estudo de caso: {ex.Message}");
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
                .Include(c => c.Professor)
                .Include(c => c.Aluno)
                .ThenInclude(a => a.Escola)
                .Include(c => c.ItensEixo)
                .ThenInclude(i => i.CatalogoEixo)
                .FirstOrDefaultAsync(c => c.Id == id && c.ProfessorId == pid);

            if (entity == null)
            {
                r.SetFalha("Estudo de caso não encontrado.");
                return r;
            }

            var diagnosticoRecente = await _db.DiagnosticosFinais
                .AsNoTracking()
                .Include(d => d.AvaliacaoDiagnostica)
                .Where(d => d.AlunoId == entity.AlunoId)
                .OrderByDescending(d => d.GeradoEm)
                .FirstOrDefaultAsync();

            entity.TextoSimulado = MontarTextoSimulado(entity, diagnosticoRecente);
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

    private async Task<(bool Ok, string Erro)> ValidarTodosEixosDoCatalogoAsync(List<int> idsEixoDistintos)
    {
        var todosIds = await _db.EstudoCasoEixosCatalogo.AsNoTracking().Select(e => e.Id).ToListAsync();
        if (todosIds.Count == 0)
            return (false, "Catálogo de eixos não configurado.");

        if (idsEixoDistintos.Count != todosIds.Count || todosIds.Any(id => !idsEixoDistintos.Contains(id)))
        {
            return (false, $"É obrigatório registrar todos os {todosIds.Count} eixos pedagógicos do catálogo neste estudo de caso.");
        }

        return (true, "");
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

    private static string MontarTextoSimulado(EstudoDeCaso entity, DiagnosticoFinal? diagnosticoRecente)
    {
        var nome = entity.Aluno?.NomeCompleto?.Trim() ?? "Aluno(a)";
        var escola = entity.Aluno?.Escola?.NomeInstituicao?.Trim() ?? "—";
        var professor = entity.Professor?.NomeCompleto?.Trim() ?? "—";
        var anoSerie = entity.Aluno?.Ano?.Trim() ?? "—";
        var titulo = entity.Titulo.Trim();
        var dataTxt = DateTime.UtcNow.ToString("dd/MM/yyyy");

        int? idade = null;
        if (entity.Aluno?.DataNascimento is { } dn)
        {
            var hoje = DateOnly.FromDateTime(DateTime.UtcNow);
            var anos = hoje.Year - dn.Year - (hoje.DayOfYear < dn.DayOfYear ? 1 : 0);
            if (anos >= 0 && anos < 130)
                idade = anos;
        }
        var idadeStr = idade.HasValue ? $"{idade.Value} anos de idade" : "idade não informada no cadastro";

        var eixosOrdenados = entity.ItensEixo.OrderBy(i => i.CatalogoEixo?.OrdemExibicao ?? 0).ToList();
        var temDiagnostico = diagnosticoRecente != null;

        var sb = new System.Text.StringBuilder();

        // Cabeçalho
        sb.AppendLine("ESTUDO DE CASO — AEE");
        sb.AppendLine(titulo);
        sb.AppendLine();
        sb.AppendLine($"Estudante: {nome}   |   Ano/Série: {anoSerie}   |   Data: {dataTxt}");
        sb.AppendLine($"Escola: {escola}   |   Professor(a) AEE: {professor}");
        sb.AppendLine();

        // 1. Identificação
        sb.AppendLine("1. Identificação do(a) estudante");
        sb.AppendLine();
        var s1 = new System.Text.StringBuilder();
        s1.Append($"{nome}, {idadeStr}");
        if (!string.IsNullOrEmpty(anoSerie) && anoSerie != "—")
            s1.Append($", matriculado(a) no {anoSerie}");
        s1.Append(". ");
        if (temDiagnostico)
        {
            var perfil = RotuloNivelAutonomia(diagnosticoRecente!.NivelPerfilAutonomia).ToLower();
            s1.Append($"Perfil de autonomia identificado na avaliação diagnóstica: {perfil}. ");
            if (!string.IsNullOrWhiteSpace(diagnosticoRecente.Resumo))
                s1.Append(diagnosticoRecente.Resumo.Trim() + " ");
        }
        else
        {
            s1.Append("Até o presente momento, não há diagnóstico clínico definitivo registrado na plataforma. ");
        }
        s1.Append(entity.ContextoSituacao.Trim());
        sb.AppendLine(s1.ToString());
        sb.AppendLine();

        // 2. Barreiras e potencialidades
        sb.AppendLine("2. Levantamento das barreiras e potencialidades");
        sb.AppendLine();
        sb.AppendLine("Barreiras observadas:");
        foreach (var item in eixosOrdenados)
        {
            var rotulo = item.CatalogoEixo?.Rotulo ?? $"Eixo #{item.EixoCatalogoId}";
            if (!string.IsNullOrWhiteSpace(item.Anotacao))
                sb.AppendLine($"• {rotulo}: {item.Anotacao.Trim()}");
            else
            {
                var hint = item.CatalogoEixo?.DescricaoHint?.Trim();
                sb.AppendLine(!string.IsNullOrWhiteSpace(hint)
                    ? $"• {rotulo}: [Completar — referência: {hint}]"
                    : $"• {rotulo}: [Completar com observações específicas]");
            }
        }
        sb.AppendLine();
        sb.AppendLine("Potencialidades identificadas:");
        sb.AppendLine("• [Completar com pontos fortes e habilidades preservadas do(a) estudante]");
        sb.AppendLine("• [Exemplo: boa comunicação oral; interesse em atividades concretas e visuais; vínculo positivo com colegas e professores]");
        sb.AppendLine();

        // 3. Avaliação pedagógica e funcional
        sb.AppendLine("3. Avaliação pedagógica e funcional");
        sb.AppendLine();
        if (temDiagnostico)
        {
            var avTitulo = diagnosticoRecente!.AvaliacaoDiagnostica?.Titulo?.Trim()
                ?? $"Avaliação #{diagnosticoRecente.AvaliacaoDiagnosticaId}";
            var perfil = RotuloNivelAutonomia(diagnosticoRecente.NivelPerfilAutonomia).ToLower();
            sb.AppendLine($"A avaliação diagnóstica mais recente ({avTitulo}, {diagnosticoRecente.GeradoEm:dd/MM/yyyy}) indica perfil de {perfil}.");
            if (!string.IsNullOrWhiteSpace(diagnosticoRecente.Recomendacoes))
                sb.AppendLine($"Recomendações registradas: {diagnosticoRecente.Recomendacoes.Trim()}");
            sb.AppendLine();
        }
        sb.AppendLine("Com base nas observações realizadas nos eixos pedagógicos, verificou-se:");
        sb.AppendLine();
        foreach (var item in eixosOrdenados)
        {
            var rotulo = (item.CatalogoEixo?.Rotulo ?? $"Eixo #{item.EixoCatalogoId}").ToLower();
            if (!string.IsNullOrWhiteSpace(item.Anotacao))
                sb.AppendLine($"Em relação a {rotulo}: {item.Anotacao.Trim()}");
            else
            {
                var hint = item.CatalogoEixo?.DescricaoHint?.Trim();
                sb.AppendLine(!string.IsNullOrWhiteSpace(hint)
                    ? $"Em relação a {rotulo}: [Completar — referência: {hint}]"
                    : $"Em relação a {rotulo}: [Completar com observações específicas]");
            }
        }
        sb.AppendLine();

        // 4. Necessidades educacionais específicas
        sb.AppendLine("4. Definição das necessidades educacionais específicas");
        sb.AppendLine();
        sb.AppendLine($"O(A) estudante {nome} necessita de:");
        sb.AppendLine();
        foreach (var item in eixosOrdenados)
        {
            var rotulo = (item.CatalogoEixo?.Rotulo ?? $"Eixo #{item.EixoCatalogoId}").ToLower();
            sb.AppendLine($"• Suporte e estratégias específicas para {rotulo};");
        }
        sb.AppendLine("• Adaptação das propostas pedagógicas conforme seu nível atual de aprendizagem;");
        sb.AppendLine("• Ampliação do tempo para realização das atividades;");
        sb.AppendLine("• Mediação pedagógica individualizada;");
        sb.AppendLine("• Articulação entre AEE, professor(a) regente e família.");
        sb.AppendLine();

        // 5. Planejamento AEE
        sb.AppendLine("5. Planejamento das ações do AEE");
        sb.AppendLine();
        sb.AppendLine("Objetivos do AEE:");
        foreach (var item in eixosOrdenados)
        {
            var rotulo = (item.CatalogoEixo?.Rotulo ?? $"Eixo #{item.EixoCatalogoId}").ToLower();
            sb.AppendLine($"• Desenvolver habilidades relacionadas a {rotulo};");
        }
        sb.AppendLine();
        sb.AppendLine("Estratégias:");
        sb.AppendLine("• Uso de recursos visuais e materiais concretos;");
        sb.AppendLine("• Sequência de tarefas curtas e objetivas;");
        sb.AppendLine("• Repetição planejada e mediação contínua;");
        sb.AppendLine("• Atividades lúdicas e jogos pedagógicos adaptados;");
        sb.AppendLine("• Rotina estruturada com momentos de avaliação contínua;");
        sb.AppendLine("• Articulação entre AEE, professor(a) regente e família.");
        sb.AppendLine();
        sb.AppendLine("Recursos:");
        sb.AppendLine("• [Completar com recursos específicos utilizados no AEE]");
        sb.AppendLine("• Tecnologias educacionais, quando necessário;");
        sb.AppendLine("• Atividades e materiais adaptados conforme as necessidades identificadas.");
        sb.AppendLine();
        sb.AppendLine("Encaminhamentos:");
        sb.AppendLine();

        // Encerramento
        var enc = new System.Text.StringBuilder();
        enc.Append($"O(A) estudante {nome} apresenta necessidades educacionais que requerem acompanhamento pedagógico contínuo, individualizado e intencional. ");
        if (!temDiagnostico)
            enc.Append("As observações realizadas indicam a necessidade de investigação mais aprofundada, sendo recomendada avaliação multiprofissional (psicologia, fonoaudiologia, psicopedagogia e/ou neuropediatria) para compreender melhor as necessidades e possíveis fatores associados. ");
        enc.Append("O trabalho do AEE deverá ocorrer de forma articulada com a sala comum, priorizando estratégias acessíveis, fortalecimento da autoestima, desenvolvimento da autonomia e garantia de participação significativa no ambiente escolar. ");
        enc.Append("A participação da família é fundamental nesse processo, sendo necessário fortalecer o diálogo e as orientações quanto ao acompanhamento escolar e especializado.");
        sb.AppendLine(enc.ToString());

        return sb.ToString();
    }

    private static string RotuloNivelAutonomia(string? codigo)
    {
        return codigo switch
        {
            NivelPerfilAutonomiaValores.NaoAvaliado => "Não avaliado",
            NivelPerfilAutonomiaValores.PredominioDependencia => "Predomínio de dependência",
            NivelPerfilAutonomiaValores.AutonomiaMediada => "Autonomia mediada",
            NivelPerfilAutonomiaValores.PredominioAutonomia => "Predomínio de autonomia",
            null or "" => "—",
            _ => codigo,
        };
    }
}
