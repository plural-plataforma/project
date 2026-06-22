using api.Constants;
using api.DTOs.AvaliacaoDiagnostica;
using api.DTOs.Bloco; // Para BlocoComAtividadesDTO
using api.DTOs.Atividade; // Para AtividadeBuscarDTO (ajuste se necessário)
using api.DTOs.Desempenho;
using api.Helpers;
using api.Models;
using api.Responses;
using Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace api.Services
{
    public class AvaliacaoDiagnosticaService
    {
        private readonly AppDbContext _contexto;
        private readonly UserManager<Usuario> _userManager;
        private static readonly HashSet<string> NiveisPermitidos = new(StringComparer.OrdinalIgnoreCase)
        {
            "Autonomia",
            "ComAjuda",
            "NaoRealizou",
            "NaoAvaliado",
        };

        public AvaliacaoDiagnosticaService(AppDbContext contexto, UserManager<Usuario> userManager)
        {
            _contexto = contexto;
            _userManager = userManager;
        }

        public async Task<ServiceResponse<List<AvaliacaoDiagnosticaBuscarDTO>>> GetAll(Usuario usuario)
        {
            var resposta = new ServiceResponse<List<AvaliacaoDiagnosticaBuscarDTO>>();
            try
            {
                var avaliacoes = await _contexto.AvaliacoesDiagnosticas
                    .Where(a => a.ProfessorId == usuario.ProfessorId || a.ProfessorId == null)
                    .Select(a => new AvaliacaoDiagnosticaBuscarDTO
                    {
                        Id = a.Id,
                        Titulo = a.Titulo,
                        Objetivo = a.Objetivo,
                        DataAplicacao = a.DataAplicacao,
                        EscolaId = a.EscolaId ?? 0,
                        Concluida = a.Concluida,
                        ProfessorId = a.ProfessorId,
                    })
                    .ToListAsync();

                resposta.AdicionaObjeto(avaliacoes);
                resposta.Sucesso = true;
                return resposta;
            }
            catch (Exception)
            {
                resposta.SetFalha("Erro ao buscar avaliações diagnósticas.");
                return resposta;
            }
        }

        public async Task<ServiceResponse<List<AvaliacaoDiagnosticaBuscarDTO>>> GetNaoConcluidas(Usuario usuario)
        {
            var resposta = new ServiceResponse<List<AvaliacaoDiagnosticaBuscarDTO>>();
            try
            {
                var avaliacoes = await _contexto.AvaliacoesDiagnosticas
                    .Where(a => (a.ProfessorId == usuario.ProfessorId || a.ProfessorId == null) && !a.Concluida)
                    .Select(a => new AvaliacaoDiagnosticaBuscarDTO
                    {
                        Id = a.Id,
                        Titulo = a.Titulo,
                        Objetivo = a.Objetivo,
                        DataAplicacao = a.DataAplicacao,
                        EscolaId = a.EscolaId ?? 0,
                        Concluida = a.Concluida,
                        ProfessorId = a.ProfessorId,
                    })
                    .ToListAsync();

                resposta.AdicionaObjeto(avaliacoes);
                resposta.Sucesso = true;
                return resposta;
            }
            catch (Exception)
            {
                resposta.SetFalha("Erro ao buscar avaliações diagnósticas não concluídas.");
                return resposta;
            }
        }

        public async Task<ServiceResponse<object>> RegistrarDesempenhoBatch(RegistrarDesempenhoBatchDTO dto)
        {
            var resposta = new ServiceResponse<object>();
            using var transacao = await _contexto.Database.BeginTransactionAsync();

            try
            {
                var avaliacao = await _contexto.AvaliacoesDiagnosticas
                    .Include(a => a.AlunosParticipantes)
                    .Include(a => a.AtividadesSelecionadas)
                    .FirstOrDefaultAsync(a => a.Id == dto.AvaliacaoDiagnosticaId);

                if (avaliacao == null)
                {
                    resposta.SetFalha("Avaliação diagnóstica não encontrada.");
                    return resposta;
                }

                var alunoIdsValidos = avaliacao.AlunosParticipantes.Select(a => a.AlunoId).ToHashSet();
                var atividadeIdsValidos = avaliacao.AtividadesSelecionadas.Select(a => a.AtividadeId).ToHashSet();

                foreach (var item in dto.Itens)
                {
                    if (!alunoIdsValidos.Contains(item.AlunoId))
                    {
                        resposta.SetFalha($"Aluno {item.AlunoId} não pertence à avaliação.");
                        return resposta;
                    }

                    if (!atividadeIdsValidos.Contains(item.AtividadeId))
                    {
                        resposta.SetFalha($"Atividade {item.AtividadeId} não pertence à avaliação.");
                        return resposta;
                    }

                    if (!NiveisPermitidos.Contains(item.NivelRealizacao))
                    {
                        resposta.SetFalha($"Nível de realização inválido: {item.NivelRealizacao}.");
                        return resposta;
                    }
                }

                var existentes = await _contexto.DesempenhosAtividades
                    .Where(d => d.AvaliacaoDiagnosticaId == dto.AvaliacaoDiagnosticaId)
                    .ToListAsync();

                foreach (var item in dto.Itens)
                {
                    var vigente = existentes
                        .Where(d => d.AlunoId == item.AlunoId && d.AtividadeId == item.AtividadeId)
                        .OrderByDescending(d => d.DataRegistro)
                        .FirstOrDefault();

                    if (vigente != null)
                    {
                        vigente.NivelRealizacao = item.NivelRealizacao;
                        vigente.Observacao = item.Observacao;
                        vigente.DataRegistro = DateTime.UtcNow;

                        var duplicatas = existentes
                            .Where(d =>
                                d.AlunoId == item.AlunoId
                                && d.AtividadeId == item.AtividadeId
                                && d.Id != vigente.Id)
                            .ToList();
                        if (duplicatas.Count > 0)
                            _contexto.DesempenhosAtividades.RemoveRange(duplicatas);
                    }
                    else
                    {
                        var novo = new DesempenhoAtividade
                        {
                            AvaliacaoDiagnosticaId = dto.AvaliacaoDiagnosticaId,
                            AlunoId = item.AlunoId,
                            AtividadeId = item.AtividadeId,
                            NivelRealizacao = item.NivelRealizacao,
                            Observacao = item.Observacao,
                            DataRegistro = DateTime.UtcNow,
                        };
                        _contexto.DesempenhosAtividades.Add(novo);
                        existentes.Add(novo);
                    }
                }

                foreach (var obsAluno in dto.ObservacoesAlunos.Where(o => !string.IsNullOrWhiteSpace(o.Observacao)))
                {
                    if (!alunoIdsValidos.Contains(obsAluno.AlunoId))
                    {
                        resposta.SetFalha($"Aluno {obsAluno.AlunoId} não pertence à avaliação.");
                        return resposta;
                    }

                    var relacaoAluno = avaliacao.AlunosParticipantes.First(a => a.AlunoId == obsAluno.AlunoId);
                    relacaoAluno.ObservacaoGeral = obsAluno.Observacao?.Trim();

                    _contexto.ObservacoesAlunosAvaliacaoHistorico.Add(new ObservacaoAlunoAvaliacaoHistorico
                    {
                        AvaliacaoDiagnosticaId = dto.AvaliacaoDiagnosticaId,
                        AlunoId = obsAluno.AlunoId,
                        Observacao = obsAluno.Observacao!.Trim(),
                        DataRegistro = DateTime.UtcNow,
                    });
                }

                await _contexto.SaveChangesAsync();

                var alunosAfetados = dto.Itens.Select(i => i.AlunoId).Distinct().ToList();
                foreach (var alunoId in alunosAfetados)
                    await GerarOuAtualizarDiagnosticoFinalAsync(dto.AvaliacaoDiagnosticaId, alunoId);

                await _contexto.SaveChangesAsync();
                await transacao.CommitAsync();

                resposta.AdicionaObjeto(new { mensagem = "Desempenhos registrados com sucesso." });
                resposta.AdicionaMensagem("Desempenhos registrados com sucesso.");
                resposta.Sucesso = true;
                return resposta;
            }
            catch (Exception ex)
            {
                await transacao.RollbackAsync();
                resposta.SetFalha($"Erro ao registrar desempenho: {ex.Message}");
                return resposta;
            }
        }

        public async Task<ServiceResponse<DesempenhoHistoricoResponseDTO>> BuscarHistoricoDesempenho(int avaliacaoId)
        {
            var resposta = new ServiceResponse<DesempenhoHistoricoResponseDTO>();

            try
            {
                var avaliacaoExiste = await _contexto.AvaliacoesDiagnosticas.AnyAsync(a => a.Id == avaliacaoId);
                if (!avaliacaoExiste)
                {
                    resposta.SetFalha("Avaliação diagnóstica não encontrada.");
                    return resposta;
                }

                var historicoItens = await _contexto.DesempenhosAtividades
                    .Where(d => d.AvaliacaoDiagnosticaId == avaliacaoId)
                    .OrderByDescending(d => d.DataRegistro)
                    .Select(d => new DesempenhoHistoricoItemDTO
                    {
                        Id = d.Id,
                        AvaliacaoDiagnosticaId = d.AvaliacaoDiagnosticaId,
                        AlunoId = d.AlunoId,
                        AtividadeId = d.AtividadeId,
                        NivelRealizacao = d.NivelRealizacao,
                        Observacao = d.Observacao,
                        DataRegistro = d.DataRegistro,
                    })
                    .ToListAsync();

                var historicoObservacoes = await _contexto.ObservacoesAlunosAvaliacaoHistorico
                    .Where(o => o.AvaliacaoDiagnosticaId == avaliacaoId)
                    .OrderByDescending(o => o.DataRegistro)
                    .Select(o => new ObservacaoAlunoHistoricoItemDTO
                    {
                        Id = o.Id,
                        AvaliacaoDiagnosticaId = o.AvaliacaoDiagnosticaId,
                        AlunoId = o.AlunoId,
                        Observacao = o.Observacao,
                        DataRegistro = o.DataRegistro,
                    })
                    .ToListAsync();

                resposta.AdicionaObjeto(new DesempenhoHistoricoResponseDTO
                {
                    Itens = historicoItens,
                    ObservacoesAlunos = historicoObservacoes,
                });
                resposta.Sucesso = true;
                return resposta;
            }
            catch (Exception ex)
            {
                resposta.SetFalha($"Erro ao buscar histórico de desempenho: {ex.Message}");
                return resposta;
            }
        }

        public async Task<ServiceResponse<DiagnosticoFinalDTO>> BuscarDiagnosticoFinalAsync(
            int avaliacaoId,
            int alunoId,
            Usuario usuario)
        {
            var resposta = new ServiceResponse<DiagnosticoFinalDTO>();
            try
            {
                var avaliacaoOk = await _contexto.AvaliacoesDiagnosticas.AnyAsync(a =>
                    a.Id == avaliacaoId && (a.ProfessorId == usuario.ProfessorId || a.ProfessorId == null));
                if (!avaliacaoOk)
                {
                    resposta.SetFalha("Avaliação diagnóstica não encontrada.");
                    return resposta;
                }

                var entity = await _contexto.DiagnosticosFinais
                    .AsNoTracking()
                    .Include(d => d.Aluno)
                    .FirstOrDefaultAsync(d => d.AvaliacaoDiagnosticaId == avaliacaoId && d.AlunoId == alunoId);

                if (entity == null)
                {
                    resposta.SetFalha("Diagnóstico final ainda não gerado. Registre o desempenho do aluno nesta avaliação.");
                    return resposta;
                }

                resposta.AdicionaObjeto(MapearDiagnosticoFinalDto(entity));
                resposta.Sucesso = true;
                return resposta;
            }
            catch (Exception ex)
            {
                resposta.SetFalha($"Erro ao buscar diagnóstico final: {ex.Message}");
                return resposta;
            }
        }

        public async Task<ServiceResponse<SugestoesPaeeAlunoDTO>> BuscarSugestoesPaeeAsync(
            int avaliacaoId,
            int alunoId,
            Usuario usuario)
        {
            var resposta = new ServiceResponse<SugestoesPaeeAlunoDTO>();
            try
            {
                var avaliacaoOk = await _contexto.AvaliacoesDiagnosticas.AnyAsync(a =>
                    a.Id == avaliacaoId && (a.ProfessorId == usuario.ProfessorId || a.ProfessorId == null));
                if (!avaliacaoOk)
                {
                    resposta.SetFalha("Avaliação diagnóstica não encontrada.");
                    return resposta;
                }

                var vigentes = await ObterDesempenhosVigentesAsync(avaliacaoId, alunoId);
                var (nivel, _) = PerfilAutonomiaHelper.DeNiveisRealizacaoComPercentual(
                    vigentes.Select(d => d.NivelRealizacao));
                var (fortes, reforcar) = await SugestaoPaeePorHabilidadeHelper.CalcularAsync(_contexto, vigentes);

                resposta.AdicionaObjeto(new SugestoesPaeeAlunoDTO
                {
                    AlunoId = alunoId,
                    NivelPerfilAutonomia = nivel,
                    RotuloExibicao = PerfilAutonomiaHelper.RotuloPortugues(nivel),
                    SugestaoPaee = PerfilAutonomiaHelper.SugestaoPaee(nivel),
                    HabilidadesFortes = string.IsNullOrWhiteSpace(fortes) ? null : fortes,
                    HabilidadesAReenforcar = string.IsNullOrWhiteSpace(reforcar) ? null : reforcar,
                });
                resposta.Sucesso = true;
                return resposta;
            }
            catch (Exception ex)
            {
                resposta.SetFalha($"Erro ao buscar sugestões PAEE: {ex.Message}");
                return resposta;
            }
        }

        public async Task<ServiceResponse<object>> FinalizarAvaliacaoAsync(int id, Usuario usuario)
        {
            var resposta = new ServiceResponse<object>();
            try
            {
                var avaliacao = await _contexto.AvaliacoesDiagnosticas
                    .Include(a => a.AlunosParticipantes)
                    .FirstOrDefaultAsync(a => a.Id == id && a.ProfessorId == usuario.ProfessorId);

                if (avaliacao == null)
                {
                    resposta.SetFalha("Avaliação diagnóstica não encontrada.");
                    return resposta;
                }

                foreach (var ap in avaliacao.AlunosParticipantes)
                    await GerarOuAtualizarDiagnosticoFinalAsync(id, ap.AlunoId);

                avaliacao.Concluida = true;
                avaliacao.UpdatedAt = DateTime.UtcNow;
                await _contexto.SaveChangesAsync();

                resposta.AdicionaObjeto(new { mensagem = "Avaliação finalizada e diagnósticos gerados." });
                resposta.AdicionaMensagem("Avaliação finalizada com sucesso.");
                resposta.Sucesso = true;
                return resposta;
            }
            catch (Exception ex)
            {
                resposta.SetFalha($"Erro ao finalizar avaliação: {ex.Message}");
                return resposta;
            }
        }

        private async Task<List<DesempenhoAtividade>> ObterDesempenhosVigentesAsync(int avaliacaoId, int alunoId)
        {
            var todos = await _contexto.DesempenhosAtividades
                .AsNoTracking()
                .Where(d => d.AvaliacaoDiagnosticaId == avaliacaoId && d.AlunoId == alunoId)
                .ToListAsync();

            return todos
                .GroupBy(d => d.AtividadeId)
                .Select(g => g.OrderByDescending(x => x.DataRegistro).First())
                .ToList();
        }

        private async Task GerarOuAtualizarDiagnosticoFinalAsync(int avaliacaoId, int alunoId)
        {
            var vigentes = await ObterDesempenhosVigentesAsync(avaliacaoId, alunoId);
            var niveis = vigentes.Select(d => d.NivelRealizacao).ToList();
            var (nivel, _) = PerfilAutonomiaHelper.DeNiveisRealizacaoComPercentual(niveis);
            var (fortes, reforcar) = await SugestaoPaeePorHabilidadeHelper.CalcularAsync(_contexto, vigentes);

            var countAutonomia = vigentes.Count(d =>
                string.Equals(d.NivelRealizacao, "Autonomia", StringComparison.OrdinalIgnoreCase));
            var countComAjuda = vigentes.Count(d =>
                string.Equals(d.NivelRealizacao, "ComAjuda", StringComparison.OrdinalIgnoreCase));
            var countNaoRealizou = vigentes.Count(d =>
                string.Equals(d.NivelRealizacao, "NaoRealizou", StringComparison.OrdinalIgnoreCase));

            var obsGeral = await _contexto.AvaliacoesAlunos
                .AsNoTracking()
                .Where(a => a.AvaliacaoDiagnosticaId == avaliacaoId && a.AlunoId == alunoId)
                .Select(a => a.ObservacaoGeral)
                .FirstOrDefaultAsync();

            var resumo = new System.Text.StringBuilder();
            resumo.Append(
                $"Atividades avaliadas: {vigentes.Count}. Autonomia: {countAutonomia}; Com ajuda: {countComAjuda}; Não realizou: {countNaoRealizou}.");
            if (!string.IsNullOrWhiteSpace(obsGeral))
                resumo.Append(' ').Append(obsGeral.Trim());

            var recomendacoes = PerfilAutonomiaHelper.SugestaoPaee(nivel);
            if (!string.IsNullOrWhiteSpace(reforcar))
                recomendacoes += $" Habilidades prioritárias para reforço: {reforcar}.";
            if (!string.IsNullOrWhiteSpace(fortes))
                recomendacoes += $" Habilidades com desempenho favorável: {fortes}.";

            var existente = await _contexto.DiagnosticosFinais
                .FirstOrDefaultAsync(d => d.AvaliacaoDiagnosticaId == avaliacaoId && d.AlunoId == alunoId);

            var now = DateTime.UtcNow;
            if (existente == null)
            {
                _contexto.DiagnosticosFinais.Add(new DiagnosticoFinal
                {
                    AvaliacaoDiagnosticaId = avaliacaoId,
                    AlunoId = alunoId,
                    Resumo = resumo.ToString(),
                    NivelPerfilAutonomia = nivel,
                    Recomendacoes = recomendacoes,
                    HabilidadesFortes = string.IsNullOrWhiteSpace(fortes) ? null : fortes,
                    HabilidadesAReenforcar = string.IsNullOrWhiteSpace(reforcar) ? null : reforcar,
                    GeradoEm = now,
                });
            }
            else
            {
                existente.Resumo = resumo.ToString();
                existente.NivelPerfilAutonomia = nivel;
                existente.Recomendacoes = recomendacoes;
                existente.HabilidadesFortes = string.IsNullOrWhiteSpace(fortes) ? null : fortes;
                existente.HabilidadesAReenforcar = string.IsNullOrWhiteSpace(reforcar) ? null : reforcar;
                existente.GeradoEm = now;
            }
        }

        private static DiagnosticoFinalDTO MapearDiagnosticoFinalDto(DiagnosticoFinal entity)
        {
            return new DiagnosticoFinalDTO
            {
                Id = entity.Id,
                AvaliacaoDiagnosticaId = entity.AvaliacaoDiagnosticaId,
                AlunoId = entity.AlunoId,
                AlunoNomeCompleto = entity.Aluno?.NomeCompleto ?? string.Empty,
                Resumo = entity.Resumo,
                NivelPerfilAutonomia = entity.NivelPerfilAutonomia,
                RotuloExibicao = PerfilAutonomiaHelper.RotuloPortugues(entity.NivelPerfilAutonomia),
                Recomendacoes = entity.Recomendacoes,
                HabilidadesFortes = entity.HabilidadesFortes,
                HabilidadesAReenforcar = entity.HabilidadesAReenforcar,
                GeradoEm = entity.GeradoEm,
            };
        }

        // Método auxiliar para montar o DTO detalhado (usado em Create, Update e GetById)
        private async Task<AvaliacaoDiagnosticaDetailDTO> MontarDetailDTO(int avaliacaoId)
        {
            var avaliacao = await _contexto.AvaliacoesDiagnosticas
        .Include(a => a.Escola)
        .Include(a => a.BlocosSelecionados).ThenInclude(b => b.Bloco)
        .Include(a => a.AtividadesSelecionadas).ThenInclude(aa => aa.Atividade).ThenInclude(at => at.Habilidades)
        .Include(a => a.AlunosParticipantes).ThenInclude(ap => ap.Aluno)
        .Include(a => a.RegistrosDesempenho)
        .FirstAsync(a => a.Id == avaliacaoId);

            var blocosOrdenados = avaliacao.BlocosSelecionados
                .OrderBy(b => b.OrdemApresentacao)
                .Select(b => new BlocoComAtividadesDTO
                {
                    Id = b.Bloco.Id,
                    Titulo = b.Bloco.Titulo ?? string.Empty,
                    Ordem = b.OrdemApresentacao,
                    Observacao = b.Bloco.Observacao,
                    Icone = b.Bloco.Icone,
                    QuantidadeAtividades = avaliacao.AtividadesSelecionadas
                        .Count(aa => aa.Atividade.BlocoId == b.BlocoId),
                    Atividades = avaliacao.AtividadesSelecionadas
                        .Where(aa => aa.Atividade.BlocoId == b.BlocoId)
                        .Select(aa => new AtividadeBuscarDTO
                        {
                            Id = aa.Atividade.Id,
                            Titulo = aa.Atividade.Titulo ?? string.Empty,
                            Enunciado = aa.Atividade.Enunciado ?? string.Empty,
                            BlocoId = aa.Atividade.BlocoId,
                            ImagemUrl = aa.Atividade.ImagemUrl,
                            Nivel = aa.Atividade.Nivel.ToString(),
                            EtapaMin = aa.Atividade.EtapaMin,
                            EtapaMax = aa.Atividade.EtapaMax,
                            Ativo = aa.Atividade.Ativo,
                            HabilidadeIds = aa.Atividade.Habilidades.Select(h => h.Id).ToList(),
                        })
                        .ToList()
                })
                .ToList();

            var registrosMaisRecentesPorPar = avaliacao.RegistrosDesempenho
                .GroupBy(r => new { r.AlunoId, r.AtividadeId })
                .Select(g => g.OrderByDescending(x => x.DataRegistro).First())
                .ToList();

            var niveisPorAluno = registrosMaisRecentesPorPar
                .GroupBy(r => r.AlunoId)
                .ToDictionary(g => g.Key, g => g.Select(x => x.NivelRealizacao).ToList());

            var atividadePorId = avaliacao.AtividadesSelecionadas
                .Where(aa => aa.Atividade != null)
                .Select(aa => aa.Atividade!)
                .GroupBy(a => a.Id)
                .ToDictionary(g => g.Key, g => g.First());

            var perfisAutonomiaPorAluno = avaliacao.AlunosParticipantes
                .Select(ap =>
                {
                    var vigentesAluno = registrosMaisRecentesPorPar
                        .Where(r => r.AlunoId == ap.AlunoId)
                        .ToList();
                    var niveis = niveisPorAluno.TryGetValue(ap.AlunoId, out var list)
                        ? list
                        : [];
                    var (nivel, pct) = PerfilAutonomiaHelper.DeNiveisRealizacaoComPercentual(niveis);
                    var (fortes, reforcar) = SugestaoPaeePorHabilidadeHelper.CalcularFromAtividades(
                        vigentesAluno,
                        atividadePorId);
                    return new AlunoPerfilAutonomiaResumoDTO
                    {
                        AlunoId = ap.AlunoId,
                        NomeCompleto = ap.Aluno?.NomeCompleto ?? string.Empty,
                        NivelPerfilAutonomia = nivel,
                        RotuloExibicao = PerfilAutonomiaHelper.RotuloPortugues(nivel),
                        SugestaoPaee = PerfilAutonomiaHelper.SugestaoPaee(nivel),
                        PercentualAutonomiaCalculado = pct,
                        HabilidadesFortes = string.IsNullOrWhiteSpace(fortes) ? null : fortes,
                        HabilidadesAReenforcar = string.IsNullOrWhiteSpace(reforcar) ? null : reforcar,
                    };
                })
                .ToList();

            return new AvaliacaoDiagnosticaDetailDTO
            {
                Id = avaliacao.Id,
                Titulo = avaliacao.Titulo,
                Objetivo = avaliacao.Objetivo,
                DataAplicacao = avaliacao.DataAplicacao,
                EscolaId = avaliacao.EscolaId,
                EscolaNome = avaliacao.Escola?.NomeInstituicao,
                Concluida = avaliacao.Concluida,
                AlunoIds = avaliacao.AlunosParticipantes.Select(ap => ap.AlunoId).ToList(),
                AlunosParticipantes = avaliacao.AlunosParticipantes
                    .Select(ap => new AvaliacaoDiagnosticaAlunoParticipanteDTO
                    {
                        AlunoId = ap.AlunoId,
                        Aluno = ap.Aluno == null
                            ? null
                            : new AvaliacaoDiagnosticaAlunoDTO
                            {
                                Id = ap.Aluno.Id,
                                NomeCompleto = ap.Aluno.NomeCompleto ?? string.Empty,
                            },
                    })
                    .ToList(),
                RegistrosDesempenho = avaliacao.RegistrosDesempenho
                    .GroupBy(r => new { r.AlunoId, r.AtividadeId })
                    .Select(g => g.OrderByDescending(x => x.DataRegistro).First())
                    .OrderBy(r => r.AlunoId)
                    .Select(r => new AvaliacaoDiagnosticaRegistroDesempenhoDTO
                    {
                        Id = r.Id,
                        AlunoId = r.AlunoId,
                        AtividadeId = r.AtividadeId,
                        NivelRealizacao = r.NivelRealizacao,
                        Observacao = r.Observacao,
                        DataRegistro = r.DataRegistro,
                    })
                    .ToList(),
                ObservacoesAlunos = avaliacao.AlunosParticipantes
                    .Select(ap => new AvaliacaoDiagnosticaObservacaoAlunoDTO
                    {
                        AlunoId = ap.AlunoId,
                        Observacao = ap.ObservacaoGeral,
                    })
                    .ToList(),
                BlocosComAtividades = blocosOrdenados,
                PerfisAutonomiaPorAluno = perfisAutonomiaPorAluno,
            };
        }

        public async Task<ServiceResponse<object>> Reivindicar(int id, Usuario usuario)
        {
            var resposta = new ServiceResponse<object>();
            try
            {
                var avaliacao = await _contexto.AvaliacoesDiagnosticas
                    .FirstOrDefaultAsync(a => a.Id == id && a.ProfessorId == null);

                if (avaliacao == null)
                {
                    resposta.SetFalha("Avaliação não encontrada ou já vinculada a outro professor.");
                    return resposta;
                }

                avaliacao.ProfessorId = usuario.ProfessorId;
                avaliacao.UpdatedAt = DateTime.UtcNow;
                await _contexto.SaveChangesAsync();

                resposta.AdicionaObjeto(new { mensagem = "Avaliação vinculada com sucesso." });
                resposta.Sucesso = true;
                return resposta;
            }
            catch (Exception)
            {
                resposta.SetFalha("Erro ao reivindicar avaliação diagnóstica.");
                return resposta;
            }
        }

        public async Task<ServiceResponse<AvaliacaoDiagnosticaDetailDTO>> Create(AvaliacaoDiagnosticaDTO dto, Usuario usuario)
        {
            var resposta = new ServiceResponse<AvaliacaoDiagnosticaDetailDTO>();

            using var transacao = await _contexto.Database.BeginTransactionAsync();
            try
            {
                if (string.IsNullOrWhiteSpace(dto.Titulo))
                {
                    resposta.SetFalha("Título é obrigatório.");
                    return resposta;
                }

                if (string.IsNullOrWhiteSpace(dto.Objetivo))
                {
                    resposta.SetFalha("Objetivo é obrigatório.");
                    return resposta;
                }

                if (dto.EscolaId.HasValue)
                {
                    var escolaDoProfessor = await _contexto.EscolasXProfessores
                        .AnyAsync(e => e.EscolaId == dto.EscolaId.Value && e.ProfessorId == usuario.ProfessorId);

                    if (!escolaDoProfessor)
                    {
                        resposta.SetFalha("Escola informada não está vinculada ao seu cadastro.");
                        return resposta;
                    }
                }


                // Validação de blocos e atividades
                if (dto.Blocos.Any())
                {
                    var blocoIds = dto.Blocos.Select(b => b.BlocoId).Distinct().ToList();
                    var blocosExistentes = await _contexto.Blocos.CountAsync(b => blocoIds.Contains(b.Id));
                    if (blocosExistentes != blocoIds.Count)
                    {
                        resposta.SetFalha("Um ou mais BlocoIds não existem.");
                        return resposta;
                    }

                    // Valida se as atividades pertencem ao bloco correspondente e remove duplicidades internas
                    foreach (var blocoSel in dto.Blocos)
                    {
                        var atividadeIdsDistinct = blocoSel.AtividadeIds.Distinct().ToList();
                        if (atividadeIdsDistinct.Any())
                        {
                            var atividadesDoBloco = await _contexto.Atividades
                                .Where(a => a.BlocoId == blocoSel.BlocoId && atividadeIdsDistinct.Contains(a.Id))
                                .CountAsync();

                            if (atividadesDoBloco != atividadeIdsDistinct.Count)
                            {
                                resposta.SetFalha($"Uma ou mais atividades informadas não pertencem ao bloco {blocoSel.BlocoId}.");
                                return resposta;
                            }
                        }
                    }
                }

                // Validação de alunos
                var alunoIds = dto.AlunoIds.Distinct().ToList();
                if (alunoIds.Any())
                {
                    var countAlunos = await _contexto.Alunos.CountAsync(a => alunoIds.Contains(a.Id));
                    if (countAlunos != alunoIds.Count)
                    {
                        resposta.SetFalha("Um ou mais AlunoIds não existem.");
                        return resposta;
                    }
                }
                var dataAplicacaoUtc = dto.DataAplicacao.HasValue
                                      ? DateTime.SpecifyKind(dto.DataAplicacao.Value, DateTimeKind.Utc)
                                      : DateTime.UtcNow.Date;

                var avaliacao = new AvaliacaoDiagnostica
                {
                    Titulo = dto.Titulo.Trim(),
                    Objetivo = dto.Objetivo.Trim(),
                    DataAplicacao = dataAplicacaoUtc,
                    EscolaId = dto.EscolaId,
                    ProfessorId = usuario.ProfessorId,
                    Concluida = false
                };

                _contexto.AvaliacoesDiagnosticas.Add(avaliacao);
                await _contexto.SaveChangesAsync();

                // Adiciona blocos (ordem baseada na posição na lista) e atividades selecionadas
                for (int ordem = 0; ordem < dto.Blocos.Count; ordem++)
                {
                    var blocoSel = dto.Blocos[ordem];
                    _contexto.AvaliacoesDiagnosticasBlocos.Add(new AvaliacaoDiagnosticaBloco
                    {
                        AvaliacaoDiagnosticaId = avaliacao.Id,
                        BlocoId = blocoSel.BlocoId,
                        OrdemApresentacao = ordem + 1
                    });

                    foreach (var atividadeId in blocoSel.AtividadeIds.Distinct())
                    {
                        _contexto.AvaliacoesDiagnosticasAtividades.Add(new AvaliacaoDiagnosticaAtividade
                        {
                            AvaliacaoDiagnosticaId = avaliacao.Id,
                            AtividadeId = atividadeId
                        });
                    }
                }

                // Adiciona alunos
                foreach (var alunoId in alunoIds)
                {
                    _contexto.AvaliacoesAlunos.Add(new AvaliacaoAluno
                    {
                        AvaliacaoDiagnosticaId = avaliacao.Id,
                        AlunoId = alunoId
                    });
                }

                await _contexto.SaveChangesAsync();
                await transacao.CommitAsync();

                var detail = await MontarDetailDTO(avaliacao.Id);
                resposta.AdicionaObjeto(detail);
                resposta.Sucesso = true;
                resposta.AdicionaMensagem("Avaliação diagnóstica criada com sucesso.");
                return resposta;
            }
            catch (Exception ex)
            {
                await transacao.RollbackAsync();

                var mensagemCompleta = ex.Message;

                if (ex.InnerException != null)
                {
                    mensagemCompleta += "\nInner Exception: " + ex.InnerException.Message;
                    if (ex.InnerException.InnerException != null)
                        mensagemCompleta += "\nInner Inner: " + ex.InnerException.InnerException.Message;
                }

                // Log no console ou Serilog/ILogger para ver no servidor
                Console.WriteLine("ERRO AO CRIAR AVALIAÇÃO:");
                Console.WriteLine(mensagemCompleta);
                Console.WriteLine("StackTrace: " + ex.StackTrace);

                // Se tiver ILogger injetado:
                // _logger.LogError(ex, "Erro ao criar avaliação diagnóstica");

                resposta.SetFalha("Erro ao criar avaliação diagnóstica: " + mensagemCompleta);
                return resposta;
            }
        }

        public async Task<ServiceResponse<AvaliacaoDiagnosticaDetailDTO>> GetById(int id, Usuario usuario)
        {
            var resposta = new ServiceResponse<AvaliacaoDiagnosticaDetailDTO>();
            try
            {
                var avaliacao = await _contexto.AvaliacoesDiagnosticas
                    .FirstOrDefaultAsync(a => a.Id == id &&
                        (a.ProfessorId == usuario.ProfessorId || a.ProfessorId == null));

                if (avaliacao == null)
                {
                    resposta.SetFalha($"Avaliação diagnóstica com ID {id} não encontrada.");
                    return resposta;
                }

                var detail = await MontarDetailDTO(id);
                resposta.AdicionaObjeto(detail);
                resposta.Sucesso = true;
                return resposta;
            }
            catch (Exception)
            {
                resposta.SetFalha("Erro ao buscar avaliação diagnóstica.");
                return resposta;
            }
        }

        public async Task<ServiceResponse<AvaliacaoDiagnosticaDetailDTO>> Update(int id, UpdateAvaliacaoDiagnosticaDTO dto, Usuario usuario)
        {
            var resposta = new ServiceResponse<AvaliacaoDiagnosticaDetailDTO>();

            if (dto.Id != id)
            {
                resposta.SetFalha("ID do corpo diferente do ID da URL.");
                return resposta;
            }

            using var transacao = await _contexto.Database.BeginTransactionAsync();
            try
            {
                var avaliacao = await _contexto.AvaliacoesDiagnosticas
                    .Include(a => a.BlocosSelecionados)
                    .Include(a => a.AtividadesSelecionadas)
                    .Include(a => a.AlunosParticipantes)
                    .FirstOrDefaultAsync(a => a.Id == id && a.ProfessorId == usuario.ProfessorId);

                if (avaliacao == null)
                {
                    resposta.SetFalha($"Avaliação diagnóstica com ID {id} não encontrada.");
                    return resposta;
                }

                if (dto.Objetivo != null && string.IsNullOrWhiteSpace(dto.Objetivo.Trim()))
                {
                    resposta.SetFalha("Objetivo é obrigatório.");
                    return resposta;
                }

                // Atualiza campos básicos
                if (!string.IsNullOrWhiteSpace(dto.Titulo))
                    avaliacao.Titulo = dto.Titulo.Trim();

                if (dto.Objetivo != null)
                    avaliacao.Objetivo = dto.Objetivo.Trim();

                if (dto.DataAplicacao.HasValue)
                    avaliacao.DataAplicacao = dto.DataAplicacao.Value;

                if (dto.EscolaId.HasValue)
                {
                    var escolaDoProfessor = await _contexto.EscolasXProfessores
                        .AnyAsync(e => e.EscolaId == dto.EscolaId.Value && e.ProfessorId == usuario.ProfessorId);

                    if (!escolaDoProfessor)
                    {
                        resposta.SetFalha("Escola informada não está vinculada ao seu cadastro.");
                        return resposta;
                    }
                }

                if (dto.Concluida.HasValue)
                    avaliacao.Concluida = dto.Concluida.Value;

                avaliacao.UpdatedAt = DateTime.UtcNow;

                // Atualização de alunos (se enviado)
                if (dto.AlunoIds != null)
                {
                    if (avaliacao.Concluida)
                    {
                        resposta.SetFalha("Não é permitido alterar alunos em avaliação já concluída.");
                        return resposta;
                    }

                    var alunoIds = dto.AlunoIds.Distinct().ToList();
                    if (alunoIds.Any())
                    {
                        var count = await _contexto.Alunos.CountAsync(a => alunoIds.Contains(a.Id));
                        if (count != alunoIds.Count)
                        {
                            resposta.SetFalha("Um ou mais AlunoIds não existem.");
                            return resposta;
                        }
                    }

                    _contexto.AvaliacoesAlunos.RemoveRange(avaliacao.AlunosParticipantes);
                    foreach (var aid in alunoIds)
                    {
                        _contexto.AvaliacoesAlunos.Add(new AvaliacaoAluno
                        {
                            AvaliacaoDiagnosticaId = id,
                            AlunoId = aid
                        });
                    }
                }

                // Atualização de blocos e atividades (se enviado)
                if (dto.Blocos != null)
                {
                    if (avaliacao.Concluida)
                    {
                        resposta.SetFalha("Não é permitido alterar blocos/atividades em avaliação já concluída.");
                        return resposta;
                    }

                    // Validação de blocos e atividades (mesma lógica do Create)
                    if (dto.Blocos.Any())
                    {
                        var blocoIds = dto.Blocos.Select(b => b.BlocoId).Distinct().ToList();
                        var blocosExistentes = await _contexto.Blocos.CountAsync(b => blocoIds.Contains(b.Id));
                        if (blocosExistentes != blocoIds.Count)
                        {
                            resposta.SetFalha("Um ou mais BlocoIds não existem.");
                            return resposta;
                        }

                        foreach (var blocoSel in dto.Blocos)
                        {
                            var atividadeIdsDistinct = blocoSel.AtividadeIds.Distinct().ToList();
                            if (atividadeIdsDistinct.Any())
                            {
                                var atividadesDoBloco = await _contexto.Atividades
                                    .Where(a => a.BlocoId == blocoSel.BlocoId && atividadeIdsDistinct.Contains(a.Id))
                                    .CountAsync();

                                if (atividadesDoBloco != atividadeIdsDistinct.Count)
                                {
                                    resposta.SetFalha($"Uma ou mais atividades informadas não pertencem ao bloco {blocoSel.BlocoId}.");
                                    return resposta;
                                }
                            }
                        }
                    }

                    // Remove antigos
                    _contexto.AvaliacoesDiagnosticasBlocos.RemoveRange(avaliacao.BlocosSelecionados);
                    _contexto.AvaliacoesDiagnosticasAtividades.RemoveRange(avaliacao.AtividadesSelecionadas);

                    // Adiciona novos
                    for (int ordem = 0; ordem < dto.Blocos.Count; ordem++)
                    {
                        var blocoSel = dto.Blocos[ordem];
                        _contexto.AvaliacoesDiagnosticasBlocos.Add(new AvaliacaoDiagnosticaBloco
                        {
                            AvaliacaoDiagnosticaId = id,
                            BlocoId = blocoSel.BlocoId,
                            OrdemApresentacao = ordem + 1
                        });

                        foreach (var atividadeId in blocoSel.AtividadeIds.Distinct())
                        {
                            _contexto.AvaliacoesDiagnosticasAtividades.Add(new AvaliacaoDiagnosticaAtividade
                            {
                                AvaliacaoDiagnosticaId = id,
                                AtividadeId = atividadeId
                            });
                        }
                    }
                }

                await _contexto.SaveChangesAsync();
                await transacao.CommitAsync();

                var detail = await MontarDetailDTO(id);
                resposta.AdicionaObjeto(detail);
                resposta.Sucesso = true;
                resposta.AdicionaMensagem("Avaliação diagnóstica atualizada com sucesso.");
                return resposta;
            }
            catch (Exception ex)
            {
                await transacao.RollbackAsync();
                resposta.SetFalha("Erro ao atualizar avaliação diagnóstica: " + ex.Message);
                return resposta;
            }
        }

        public async Task<byte[]> GerarPdfBytesAsync(int avaliacaoId, Usuario usuario)
        {
            var resposta = await GetById(avaliacaoId, usuario);
            if (!resposta.Sucesso || resposta.Objeto == null)
            {
                throw new InvalidOperationException("Avaliação não encontrada ou erro ao carregar dados.");
            }

            var dto = resposta.Objeto;
            return await GerarPdfDiagnosticoAsync(dto);
        }

        private async Task<byte[]> GerarPdfDiagnosticoAsync(AvaliacaoDiagnosticaDetailDTO dto)
        {
            var orderedBlocos = dto.BlocosComAtividades.OrderBy(b => b.Ordem).ToList();
            var imagensPorUrl = new Dictionary<string, byte[]?>(StringComparer.OrdinalIgnoreCase);

            using var http = new HttpClient();
            http.Timeout = TimeSpan.FromSeconds(45);

            foreach (var bloco in orderedBlocos)
            {
                foreach (var atv in bloco.Atividades)
                {
                    var url = atv.ImagemUrl;
                    if (string.IsNullOrWhiteSpace(url) || imagensPorUrl.ContainsKey(url))
                        continue;
                    try
                    {
                        imagensPorUrl[url] = await http.GetByteArrayAsync(url).ConfigureAwait(false);
                    }
                    catch (Exception ex)
                    {
                        imagensPorUrl[url] = null;
                        Console.WriteLine($"[PDF] Falha ao baixar imagem {url}: {ex.Message}");
                    }
                }
            }

            return GerarPdfDiagnostico(dto, imagensPorUrl);
        }

        private static byte[] GerarPdfDiagnostico(AvaliacaoDiagnosticaDetailDTO dto, IReadOnlyDictionary<string, byte[]?> imagensPorUrl)
        {
            var orderedBlocos = dto.BlocosComAtividades.OrderBy(b => b.Ordem).ToList();
            var temResultadosDesempenho = dto.RegistrosDesempenho is { Count: > 0 };
            var perfisComResultado = dto.PerfisAutonomiaPorAluno
                .Where(p => !string.Equals(
                    p.NivelPerfilAutonomia,
                    NivelPerfilAutonomiaValores.NaoAvaliado,
                    StringComparison.OrdinalIgnoreCase))
                .OrderBy(p => p.NomeCompleto)
                .ToList();

            void ConfigurarPaginaPadrao(PageDescriptor page)
            {
                page.Size(PageSizes.A4);
                page.Margin(2.5f, Unit.Centimetre);
                page.PageColor(Colors.White);
                page.DefaultTextStyle(x => x.FontSize(11).FontFamily("Arial"));
            }

            void ConfigurarRodape(PageDescriptor page)
            {
                page.Footer()
                    .AlignCenter()
                    .PaddingVertical(0.8f, Unit.Centimetre)
                    .Row(row =>
                    {
                        row.RelativeItem()
                            .AlignLeft()
                            .Text(text =>
                            {
                                text.Span($"Gerado em {DateTime.Now:dd/MM/yyyy HH:mm}")
                                    .FontSize(9)
                                    .FontColor(Colors.Grey.Medium);
                            });

                        row.RelativeItem()
                            .AlignRight()
                            .Text(text =>
                            {
                                text.Span("Página ")
                                    .FontSize(9)
                                    .FontColor(Colors.Grey.Medium);

                                text.CurrentPageNumber()
                                    .FontSize(9)
                                    .FontColor(Colors.Grey.Medium);
                            });
                    });
            }

            var document = Document.Create(container =>
            {
                container.Page(page =>
                {
                    ConfigurarPaginaPadrao(page);

                    page.Header()
                        .PaddingBottom(0.6f, Unit.Centimetre)
                        .AlignCenter()
                        .Text("Avaliação Diagnóstica — Plural")
                        .SemiBold()
                        .FontSize(18)
                        .FontColor(Colors.Blue.Medium);

                    page.Content()
                        .PaddingVertical(0.6f, Unit.Centimetre)
                        .Column(col =>
                        {
                            col.Spacing(10);

                            col.Item().AlignCenter().Text(dto.Titulo).SemiBold().FontSize(16);

                            col.Item().Row(r =>
                            {
                                r.RelativeItem().Text("Objetivo: ").SemiBold();
                                r.RelativeItem(3).Text(dto.Objetivo ?? "—");
                            });

                            col.Item().Row(r =>
                            {
                                r.RelativeItem().Text("Data de aplicação: ").SemiBold();
                                r.RelativeItem(3).Text(dto.DataAplicacao.ToString("dd/MM/yyyy") ?? "—");
                            });

                            if (!string.IsNullOrWhiteSpace(dto.EscolaNome))
                            {
                                col.Item().Row(r =>
                                {
                                    r.RelativeItem().Text("Escola: ").SemiBold();
                                    r.RelativeItem(3).Text(dto.EscolaNome);
                                });
                            }

                            var alunosOrdenados = dto.AlunosParticipantes
                                .OrderBy(a => a.Aluno?.NomeCompleto)
                                .ToList();
                            if (alunosOrdenados.Count > 0)
                            {
                                col.Item().PaddingTop(8).Text("Alunos").SemiBold().FontSize(12);
                                foreach (var ap in alunosOrdenados)
                                {
                                    col.Item().Text($"• {ap.Aluno?.NomeCompleto ?? "—"}").FontSize(10);
                                }
                            }

                            col.Item().PaddingTop(14).Text("Atividades para aplicação")
                                .SemiBold().FontSize(13).FontColor(Colors.Grey.Darken2);

                            col.Item().PaddingTop(4).Text(
                                    "Cada atividade está em uma página seguinte, com imagem em destaque. Registre o desempenho na plataforma após aplicar com o(s) aluno(s).")
                                .FontSize(9).Italic().FontColor(Colors.Grey.Medium);

                            foreach (var bloco in orderedBlocos)
                            {
                                col.Item().PaddingTop(8).Text($"{bloco.Ordem} — {bloco.Titulo}")
                                    .SemiBold().FontSize(11).FontColor(Colors.Blue.Darken1);

                                foreach (var atv in bloco.Atividades)
                                {
                                    col.Item().PaddingLeft(12).Text($"• {atv.Titulo}").FontSize(10);
                                }
                            }
                        });

                    ConfigurarRodape(page);
                });

                foreach (var bloco in orderedBlocos)
                {
                    foreach (var atv in bloco.Atividades)
                    {
                        container.Page(page =>
                        {
                            ConfigurarPaginaPadrao(page);

                            page.Header()
                                .PaddingBottom(0.5f, Unit.Centimetre)
                                .AlignCenter()
                                .Column(header =>
                                {
                                    header.Item().Text("Avaliação Diagnóstica")
                                        .SemiBold().FontSize(12).FontColor(Colors.Blue.Medium);
                                    header.Item().Text(dto.Titulo).FontSize(10).FontColor(Colors.Grey.Darken1);
                                });

                            page.Content()
                                .PaddingVertical(0.4f, Unit.Centimetre)
                                .Column(col =>
                                {
                                    col.Spacing(8);

                                    col.Item().Text($"{bloco.Ordem} — {bloco.Titulo}")
                                        .SemiBold().FontSize(12).FontColor(Colors.Blue.Darken1);

                                    if (!string.IsNullOrWhiteSpace(bloco.Observacao))
                                    {
                                        col.Item().Text($"Observação do eixo: {bloco.Observacao}")
                                            .Italic().FontSize(10).FontColor(Colors.Grey.Medium);
                                    }

                                    col.Item().Text(atv.Titulo).SemiBold().FontSize(14);

                                    if (!string.IsNullOrWhiteSpace(atv.ImagemUrl))
                                    {
                                        if (imagensPorUrl.TryGetValue(atv.ImagemUrl, out var imageBytes) &&
                                            imageBytes != null && imageBytes.Length > 0)
                                        {
                                            col.Item()
                                                .PaddingVertical(10)
                                                .AlignCenter()
                                                .MaxHeight(420)
                                                .Image(imageBytes)
                                                .FitArea()
                                                .WithCompressionQuality(ImageCompressionQuality.Medium);
                                        }
                                        else
                                        {
                                            col.Item()
                                                .PaddingTop(6)
                                                .Text("(Imagem não disponível)")
                                                .Italic()
                                                .FontSize(10)
                                                .FontColor(Colors.Red.Medium);
                                        }
                                    }

                                    if (!string.IsNullOrWhiteSpace(atv.Enunciado))
                                    {
                                        col.Item().PaddingTop(8).Text(atv.Enunciado).FontSize(11);
                                    }
                                });

                            ConfigurarRodape(page);
                        });
                    }
                }

                if (temResultadosDesempenho && perfisComResultado.Count > 0)
                {
                    container.Page(page =>
                    {
                        ConfigurarPaginaPadrao(page);

                        page.Header()
                            .PaddingBottom(0.6f, Unit.Centimetre)
                            .AlignCenter()
                            .Text("Resultados — Perfil de autonomia")
                            .SemiBold()
                            .FontSize(14)
                            .FontColor(Colors.Blue.Medium);

                        page.Content()
                            .PaddingVertical(0.6f, Unit.Centimetre)
                            .Column(col =>
                            {
                                col.Spacing(10);

                                col.Item().Text(
                                        "Visão agregada a partir dos níveis registrados por atividade (Autonomia / Com ajuda / Não realizou). Sugestões apoiam o planejamento PAEE.")
                                    .FontSize(9).Italic().FontColor(Colors.Grey.Medium);

                                foreach (var perfil in perfisComResultado)
                                {
                                    col.Item().PaddingTop(10).Column(bloco =>
                                    {
                                        bloco.Item().Text(perfil.NomeCompleto)
                                            .SemiBold().FontSize(11).FontColor(Colors.Blue.Darken2);

                                        bloco.Item().PaddingTop(2).Text(perfil.RotuloExibicao)
                                            .FontSize(10);

                                        bloco.Item().PaddingTop(4).Text($"Sugestão PAEE: {perfil.SugestaoPaee}")
                                            .FontSize(9).Italic().FontColor(Colors.Grey.Darken1);

                                        if (!string.IsNullOrWhiteSpace(perfil.HabilidadesAReenforcar))
                                        {
                                            bloco.Item().PaddingTop(3).Text(
                                                    $"Habilidades a reforçar: {perfil.HabilidadesAReenforcar}")
                                                .FontSize(9).FontColor(Colors.Grey.Darken2);
                                        }

                                        if (!string.IsNullOrWhiteSpace(perfil.HabilidadesFortes))
                                        {
                                            bloco.Item().PaddingTop(2).Text(
                                                    $"Habilidades fortes: {perfil.HabilidadesFortes}")
                                                .FontSize(9).FontColor(Colors.Grey.Darken2);
                                        }
                                    });
                                }
                            });

                        ConfigurarRodape(page);
                    });
                }
            });

            return document.GeneratePdf();
        }

    }
}