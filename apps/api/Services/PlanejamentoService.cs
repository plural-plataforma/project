using api.DTOs.Aluno;
using api.DTOs.Estrategia;
using api.DTOs.Habilidade;
using api.DTOs.Avaliacao;
using api.DTOs.Planejamento;
using api.Helpers;
using api.Models;
using api.Responses;
using api.Services.IA;
using Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace api.Services
{
    public class PlanejamentoService
    {
        private readonly AppDbContext _contexto;
        private readonly UserManager<Usuario> _usuario;
        private readonly PromptSistemaIAService _promptService;
        private readonly IGeradorTextoIA _geradorTextoIA;
        private readonly GeracaoIALogService _geracaoLog;

        public PlanejamentoService(
            AppDbContext contexto,
            UserManager<Usuario> usuario,
            PromptSistemaIAService promptService,
            IGeradorTextoIA geradorTextoIA,
            GeracaoIALogService geracaoLog)
        {
            _contexto = contexto;
            _usuario = usuario;
            _promptService = promptService;
            _geradorTextoIA = geradorTextoIA;
            _geracaoLog = geracaoLog;
        }

        /// <returns>Mensagem de erro ou null quando não há conflito.</returns>
        private async Task<string?> ObterMensagemOverlapAoDefinirPeriodoParaPlano(
            int professorId,
            int planejamentoId,
            DateOnly iniProspectivo,
            DateOnly fimProspectivo)
        {
            var apelidoConflituoso = await (
                from minha in _contexto.AlunosXPlanejamentos.Where(x => x.PlanejamentoId == planejamentoId)
                join outra in _contexto.AlunosXPlanejamentos on minha.AlunoId equals outra.AlunoId
                where outra.PlanejamentoId != planejamentoId
                join p in _contexto.Planejamentos on outra.PlanejamentoId equals p.ID
                where p.IdProfessor == professorId
                      && iniProspectivo <= p.DataFim && p.DataInicio <= fimProspectivo
                select p.Apelido
            ).FirstOrDefaultAsync();

            return apelidoConflituoso != null
                ? $"Há aluno(ns) já vinculado(s) a outro PAEE com período intersectando (PAEE «{apelidoConflituoso}»)."
                : null;
        }

        private async Task<string?> ObterMensagemOverlapAoVincularAlunoAsync(int professorId, int planejamentoId,
            int alunoId)
        {
            var atual = await _contexto.Planejamentos.AsNoTracking()
                .Where(p => p.ID == planejamentoId && p.IdProfessor == professorId)
                .Select(p => new { p.DataInicio, p.DataFim })
                .FirstOrDefaultAsync();
            if (atual == null)
                return null;

            var apelidoConflituoso = await _contexto.AlunosXPlanejamentos
                .Where(ax => ax.AlunoId == alunoId && ax.PlanejamentoId != planejamentoId)
                .Join(_contexto.Planejamentos.Where(p => p.IdProfessor == professorId),
                    ax => ax.PlanejamentoId,
                    p => p.ID,
                    (_, p) => p)
                .Where(p => atual.DataInicio <= p.DataFim && p.DataInicio <= atual.DataFim)
                .Select(p => p.Apelido)
                .FirstOrDefaultAsync();

            return apelidoConflituoso != null
                ? $"Este aluno já participa do PAEE «{apelidoConflituoso}» em período que intersecta este PAEE."
                : null;
        }

        public async Task<ServiceResponse<PlanejamentoCadastroDTO>> Cadastro(PlanejamentoCadastroDTO planejamentoDTO, Usuario usuario)
        {
            var resposta = new ServiceResponse<PlanejamentoCadastroDTO>();
            if (planejamentoDTO.DataInicio > planejamentoDTO.DataFim)
            {
                resposta.SetFalha("Data de início não pode ser posterior à data de fim.");
                return resposta;
            }

            using (var transacao = await _contexto.Database.BeginTransactionAsync())
            {
                try
                {
                    Planejamento planejamento = new Planejamento()
                    {
                        Apelido = planejamentoDTO.Apelido,
                        DataInicio = planejamentoDTO.DataInicio,
                        DataFim = planejamentoDTO.DataFim,
                        IdProfessor = (int)usuario.ProfessorId,
                        DescicaoPlanejamento= planejamentoDTO.DescicaoPlanejamento
    };
                    _contexto.Planejamentos.Add(planejamento);
                    await _contexto.SaveChangesAsync();

                    await transacao.CommitAsync();
                    resposta.Sucesso = true;
                    resposta.AdicionaMensagem("Cadastro de planejamento realizado com sucesso.");
                    return resposta;
                }
                catch (Exception)
                {

                    await transacao.RollbackAsync();
                    resposta.SetFalha("Erro ao cadastrar planejamento.");
                    throw;
                }
            }

        }

        public async Task<ServiceResponse<PlanejamentoAtualizarDTO>> Atualizar(PlanejamentoAtualizarDTO planejamentoDTO, Usuario usuario)
        {
            var resposta = new ServiceResponse<PlanejamentoAtualizarDTO>();

            try
            {
                Planejamento planejamento = await _contexto.Planejamentos.FirstOrDefaultAsync(p => p.ID == planejamentoDTO.Id && p.IdProfessor == usuario.ProfessorId);
                if (planejamento == null)
                {
                    resposta.SetFalha("Planejamento não encontrado.");
                    return resposta;
                }

                var novoInicio = planejamentoDTO.DataInicio ?? planejamento.DataInicio;
                var novoFim = planejamentoDTO.DataFim ?? planejamento.DataFim;
                if (novoInicio > novoFim)
                {
                    resposta.SetFalha("Data de início não pode ser posterior à data de fim.");
                    return resposta;
                }

                var professorId = (int)usuario.ProfessorId;
                var overlapMsg = await ObterMensagemOverlapAoDefinirPeriodoParaPlano(professorId, planejamento.ID, novoInicio, novoFim);
                if (overlapMsg != null)
                {
                    resposta.SetFalha(overlapMsg);
                    return resposta;
                }

                if (!string.IsNullOrEmpty(planejamentoDTO.Apelido))
                {
                    planejamento.Apelido= planejamentoDTO.Apelido;
                }

                if (planejamentoDTO.DataInicio.HasValue)
                {
                    planejamento.DataInicio= (DateOnly)planejamentoDTO.DataInicio;
                }

                if (planejamentoDTO.DataFim.HasValue)
                {
                    planejamento.DataFim = (DateOnly)planejamentoDTO.DataFim;
                }

                if (!string.IsNullOrEmpty(planejamentoDTO.DescicaoPlanejamento))
                {
                        planejamento.DescicaoPlanejamento = planejamentoDTO.DescicaoPlanejamento;
                 }

                if (planejamentoDTO.ObjetivoCurtoPrazo != null)
                {
                    planejamento.ObjetivoCurtoPrazo = planejamentoDTO.ObjetivoCurtoPrazo;
                    planejamento.ObjetivoCurtoCatalogoId = planejamentoDTO.ObjetivoCurtoCatalogoId;
                }
                if (planejamentoDTO.ObjetivoMedioPrazo != null)
                {
                    planejamento.ObjetivoMedioPrazo = planejamentoDTO.ObjetivoMedioPrazo;
                    planejamento.ObjetivoMedioCatalogoId = planejamentoDTO.ObjetivoMedioCatalogoId;
                }
                if (planejamentoDTO.ObjetivoLongoPrazo != null)
                {
                    planejamento.ObjetivoLongoPrazo = planejamentoDTO.ObjetivoLongoPrazo;
                    planejamento.ObjetivoLongoCatalogoId = planejamentoDTO.ObjetivoLongoCatalogoId;
                }
                if (planejamentoDTO.DocumentoDeclaradoAssinado.HasValue)
                    planejamento.DocumentoDeclaradoAssinado = planejamentoDTO.DocumentoDeclaradoAssinado.Value;
                if (planejamentoDTO.AssinaturaNomeResponsavel != null)
                    planejamento.AssinaturaNomeResponsavel = planejamentoDTO.AssinaturaNomeResponsavel;
                if (planejamentoDTO.AssinaturaCargo != null)
                    planejamento.AssinaturaCargo = planejamentoDTO.AssinaturaCargo;

                    await _contexto.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                resposta.SetFalha(ex.Message);
                return resposta;
            }

            resposta.AdicionaMensagem("Atualização de planejamento realizada com sucesso.");
            return resposta;
        }

        public async Task<ServiceResponse<PlanejamentoBuscarDTO>> Buscar(Usuario usuario)
        {
            var resposta = new ServiceResponse<PlanejamentoBuscarDTO>();
            try
            {
                var planejamentos = await _contexto.Planejamentos
                    .AsNoTracking()
                    .Where(p => p.IdProfessor == usuario.ProfessorId)
                    .Select(p => new PlanejamentoBuscarDTO
                    {
                        Id = p.ID,
                        Apelido = p.Apelido,
                        DataInicio = p.DataInicio,
                        DataFim = p.DataFim,
                        DescicaoPlanejamento = p.DescicaoPlanejamento,
                        ObjetivoCurtoPrazo = p.ObjetivoCurtoPrazo,
                        ObjetivoMedioPrazo = p.ObjetivoMedioPrazo,
                        ObjetivoLongoPrazo = p.ObjetivoLongoPrazo,
                        ObjetivoCurtoCatalogoId = p.ObjetivoCurtoCatalogoId,
                        ObjetivoMedioCatalogoId = p.ObjetivoMedioCatalogoId,
                        ObjetivoLongoCatalogoId = p.ObjetivoLongoCatalogoId,
                        DocumentoDeclaradoAssinado = p.DocumentoDeclaradoAssinado,
                        AssinaturaNomeResponsavel = p.AssinaturaNomeResponsavel,
                        AssinaturaCargo = p.AssinaturaCargo,
                        Encontros = p.Encontros
                            .OrderBy(e => e.DataEnc).ThenBy(e => e.Id)
                            .Select(e => new PaeeEncontroBuscarDTO
                            {
                                Id = e.Id,
                                DataEnc = e.DataEnc,
                                TextoPlanejado = e.TextoPlanejado,
                                TextoRealizado = e.TextoRealizado,
                                HabilidadeId = e.HabilidadeId,
                                EstrategiaId = e.EstrategiaId,
                            }).ToList(),
                        Habilidades = p.HabilidadesXPlanejamentos
                            .Select(hp => new HabilidadeBuscarDTO
                            {
                                Id = hp.Habilidade.Id,
                                IdNivelEnsino = hp.Habilidade.IdNivelEnsino,
                                Tipo = hp.Habilidade.Tipo,
                                Descricao = hp.Habilidade.Descricao,
                                Resumo = hp.Habilidade.Resumo
                            })
                            .ToList(),
                        Estrategias = p.EstrategiasXPlanejamentos
                            .Select(hp => new EstrategiaBuscarDTO
                            {
                                Id = hp.Estrategia.Id,
                                Descricao = hp.Estrategia.Descricao
                            })
                            .ToList(),
                        Avaliacao = p.AvaliacaoXPlanejamentos
                            .Select(hp => new AvaliacaoBuscarDTO
                            {
                                Id = hp.Avaliacao.Id,
                                Descricao = hp.Avaliacao.Descricao
                            })
                            .ToList(),

                        Alunos = p.AlunosXPlanejamentos
                            .Select(ap => new AlunoResumoDTO()
                            {
                                Id = ap.Aluno.Id,
                                NomeCompleto = ap.Aluno.NomeCompleto
                            })
                            .ToList()
                    })
                    .ToListAsync();
                
                resposta.AdicionaObjetos(planejamentos);
                resposta.Sucesso = true;
                return resposta;
            }
            catch (Exception)
            {
                resposta.SetFalha("Erro ao buscar planejamentos.");
                return resposta;
            }
        }

        public async Task<ServiceResponse<PlanejamentoBuscarDTO>> Buscar(int id, Usuario usuario)
        {
            var resposta = new ServiceResponse<PlanejamentoBuscarDTO>();
            try
            {
                var planejamentos = await _contexto.Planejamentos
                    .AsNoTracking()
                    .Where(p => p.ID == id && p.IdProfessor == usuario.ProfessorId)
                    .Select(p => new PlanejamentoBuscarDTO
                    {
                        Id = p.ID,
                        Apelido = p.Apelido,
                        DataInicio = p.DataInicio,
                        DataFim = p.DataFim,
                        DescicaoPlanejamento = p.DescicaoPlanejamento,
                        ObjetivoCurtoPrazo = p.ObjetivoCurtoPrazo,
                        ObjetivoMedioPrazo = p.ObjetivoMedioPrazo,
                        ObjetivoLongoPrazo = p.ObjetivoLongoPrazo,
                        ObjetivoCurtoCatalogoId = p.ObjetivoCurtoCatalogoId,
                        ObjetivoMedioCatalogoId = p.ObjetivoMedioCatalogoId,
                        ObjetivoLongoCatalogoId = p.ObjetivoLongoCatalogoId,
                        DocumentoDeclaradoAssinado = p.DocumentoDeclaradoAssinado,
                        AssinaturaNomeResponsavel = p.AssinaturaNomeResponsavel,
                        AssinaturaCargo = p.AssinaturaCargo,
                        Encontros = p.Encontros
                            .OrderBy(e => e.DataEnc).ThenBy(e => e.Id)
                            .Select(e => new PaeeEncontroBuscarDTO
                            {
                                Id = e.Id,
                                DataEnc = e.DataEnc,
                                TextoPlanejado = e.TextoPlanejado,
                                TextoRealizado = e.TextoRealizado,
                                HabilidadeId = e.HabilidadeId,
                                EstrategiaId = e.EstrategiaId,
                            }).ToList(),
                        Habilidades = p.HabilidadesXPlanejamentos
                            .Select(hp => new HabilidadeBuscarDTO
                            {
                                Id = hp.Habilidade.Id,
                                IdNivelEnsino = hp.Habilidade.IdNivelEnsino,
                                Tipo = hp.Habilidade.Tipo,
                                Descricao = hp.Habilidade.Descricao,
                                Resumo = hp.Habilidade.Resumo
                            })
                            .ToList(),
                        Estrategias = p.EstrategiasXPlanejamentos
                            .Select(hp => new EstrategiaBuscarDTO
                            {
                                Id = hp.Estrategia.Id,
                                Descricao = hp.Estrategia.Descricao
                            })
                            .ToList(),
                        Avaliacao = p.AvaliacaoXPlanejamentos
                            .Select(hp => new AvaliacaoBuscarDTO
                            {
                                Id = hp.Avaliacao.Id,
                                Descricao = hp.Avaliacao.Descricao
                            })
                            .ToList(),

                        Alunos = p.AlunosXPlanejamentos
                            .Select(ap => new AlunoResumoDTO()
                            {
                                Id = ap.Aluno.Id,
                                NomeCompleto = ap.Aluno.NomeCompleto
                            })
                            .ToList()
                    })
                    .FirstOrDefaultAsync();

                resposta.AdicionaObjeto(planejamentos);
                resposta.Sucesso = true;
                return resposta;
            }
            catch (Exception)
            {
                resposta.SetFalha("Erro ao buscar planejamento.");
                return resposta;
            }
        }

        public async Task<ServiceResponse<PlanejamentoBuscarDTO>> GerarObjetivosIAAsync(int planejamentoId, Usuario usuario)
        {
            var r = new ServiceResponse<PlanejamentoBuscarDTO>();
            try
            {
                var planejamento = await _contexto.Planejamentos
                    .Include(p => p.AlunosXPlanejamentos).ThenInclude(ax => ax.Aluno)
                    .Include(p => p.HabilidadesXPlanejamentos).ThenInclude(hx => hx.Habilidade)
                    .Include(p => p.EstrategiasXPlanejamentos).ThenInclude(ex => ex.Estrategia)
                    .FirstOrDefaultAsync(p => p.ID == planejamentoId && p.IdProfessor == usuario.ProfessorId);

                if (planejamento == null)
                {
                    r.SetFalha("Planejamento não encontrado.");
                    return r;
                }

                var aluno = planejamento.AlunosXPlanejamentos.Select(ax => ax.Aluno).FirstOrDefault();
                if (aluno == null)
                {
                    r.SetFalha("Vincule um aluno ao PAEE antes de gerar objetivos por IA.");
                    return r;
                }

                var estudoCaso = await _contexto.EstudosCaso
                    .AsNoTracking()
                    .Include(e => e.ItensEixo).ThenInclude(i => i.CatalogoEixo)
                    .Where(e => e.AlunoId == aluno.Id)
                    .OrderByDescending(e => e.UpdatedAt)
                    .FirstOrDefaultAsync();

                var systemPrompt = await _promptService.BuscarConteudoAtivoAsync(TipoDocumentoIA.PAEE);
                if (string.IsNullOrWhiteSpace(systemPrompt))
                {
                    r.SetFalha("Nenhum prompt de sistema cadastrado para PAEE. Peça à gestora para configurar em Prompts de IA.");
                    return r;
                }

                var promptUsuario = MontarPromptObjetivosPaee(planejamento, aluno, estudoCaso);

                string textoGerado;
                try
                {
                    textoGerado = await _geradorTextoIA.GerarTextoAsync(systemPrompt, promptUsuario);
                }
                catch (InvalidOperationException ex)
                {
                    await _geracaoLog.RegistrarAsync(usuario.ProfessorId ?? 0, TipoDocumentoIA.PAEE, planejamentoId, aluno.Id, sucesso: false);
                    r.SetFalha(ex.Message);
                    return r;
                }

                var partes = System.Text.RegularExpressions.Regex
                    .Split(textoGerado.Trim(), @"\r?\n\s*\r?\n")
                    .Select(p => p.Trim())
                    .Where(p => p.Length > 0)
                    .ToList();

                if (partes.Count != 3)
                {
                    await _geracaoLog.RegistrarAsync(usuario.ProfessorId ?? 0, TipoDocumentoIA.PAEE, planejamentoId, aluno.Id, sucesso: false);
                    r.SetFalha("A IA não retornou os 3 parágrafos esperados (objetivo de curto, médio e longo prazo). Tente gerar novamente.");
                    return r;
                }

                planejamento.ObjetivoCurtoPrazo = partes[0];
                planejamento.ObjetivoMedioPrazo = partes[1];
                planejamento.ObjetivoLongoPrazo = partes[2];
                planejamento.ObjetivoCurtoCatalogoId = null;
                planejamento.ObjetivoMedioCatalogoId = null;
                planejamento.ObjetivoLongoCatalogoId = null;

                await _contexto.SaveChangesAsync();

                await _geracaoLog.RegistrarAsync(usuario.ProfessorId ?? 0, TipoDocumentoIA.PAEE, planejamentoId, aluno.Id, sucesso: true);

                var atualizado = await Buscar(planejamentoId, usuario);
                atualizado.AdicionaMensagem("Objetivos gerados por IA. Revise antes de usar em documentos oficiais.");
                return atualizado;
            }
            catch (Exception ex)
            {
                r.SetFalha($"Erro ao gerar objetivos do PAEE via IA: {ex.Message}");
                return r;
            }
        }

        private static string MontarPromptObjetivosPaee(Planejamento planejamento, Aluno aluno, EstudoDeCaso? estudoCaso)
        {
            var nome = aluno.NomeCompleto?.Trim() ?? "Aluno(a)";
            var anoSerie = aluno.Ano?.Trim() ?? "não informado";

            var sb = new System.Text.StringBuilder();
            sb.AppendLine("Redija os objetivos do PAEE a partir destes dados (siga a estrutura de 3 parágrafos definida no system prompt):");
            sb.AppendLine();
            sb.AppendLine($"Estudante: {nome}");
            sb.AppendLine($"Ano/Série: {anoSerie}");
            sb.AppendLine($"PAEE: {planejamento.Apelido}");
            if (!string.IsNullOrWhiteSpace(planejamento.DescicaoPlanejamento))
                sb.AppendLine($"Descrição do planejamento: {planejamento.DescicaoPlanejamento.Trim()}");

            if (estudoCaso != null)
            {
                sb.AppendLine();
                sb.AppendLine($"Estudo de caso: {estudoCaso.Titulo.Trim()}");
                var textoEstudo = (estudoCaso.TextoGeradoIA ?? estudoCaso.TextoSimulado)?.Trim();
                if (!string.IsNullOrWhiteSpace(textoEstudo))
                    sb.AppendLine($"Texto do estudo de caso: {textoEstudo}");

                var eixosComAnotacao = estudoCaso.ItensEixo
                    .Where(i => !string.IsNullOrWhiteSpace(i.Anotacao))
                    .OrderBy(i => i.CatalogoEixo?.OrdemExibicao ?? 0)
                    .ToList();
                if (eixosComAnotacao.Count > 0)
                {
                    sb.AppendLine();
                    sb.AppendLine("Barreiras e anotações por eixo (Estudo de Caso):");
                    foreach (var item in eixosComAnotacao)
                    {
                        var rotulo = item.CatalogoEixo?.Rotulo ?? $"Eixo #{item.EixoCatalogoId}";
                        sb.AppendLine($"- {rotulo}: {item.Anotacao!.Trim()}");
                    }
                }
            }
            else
            {
                sb.AppendLine();
                sb.AppendLine("Não há Estudo de Caso registrado para este aluno até o momento.");
            }

            var habilidades = planejamento.HabilidadesXPlanejamentos
                .Select(hx => SugestaoPaeePorHabilidadeHelper.FormatarRotuloHabilidade(hx.Habilidade))
                .ToList();
            sb.AppendLine();
            sb.AppendLine(habilidades.Count > 0
                ? $"Habilidades vinculadas a este PAEE: {string.Join("; ", habilidades)}"
                : "Nenhuma habilidade vinculada a este PAEE até o momento.");

            var estrategias = planejamento.EstrategiasXPlanejamentos
                .Where(ex => !string.IsNullOrWhiteSpace(ex.Estrategia?.Descricao))
                .Select(ex => ex.Estrategia.Descricao.Trim())
                .ToList();
            sb.AppendLine(estrategias.Count > 0
                ? $"Estratégias vinculadas a este PAEE: {string.Join("; ", estrategias)}"
                : "Nenhuma estratégia vinculada a este PAEE até o momento.");

            return sb.ToString();
        }

        public async Task<ServiceResponse<bool>> SubstituirEncontros(
            int idPlanejamento,
            PlanejamentoEncontrosSubstituicaoDTO dto,
            Usuario usuario)
        {
            var resposta = new ServiceResponse<bool>();

            await using var transacao = await _contexto.Database.BeginTransactionAsync();
            try
            {
                var professorId = (int)usuario.ProfessorId!;
                var planejamento = await _contexto.Planejamentos.FirstOrDefaultAsync(p =>
                    p.ID == idPlanejamento && p.IdProfessor == professorId);
                if (planejamento == null)
                {
                    await transacao.RollbackAsync();
                    resposta.SetFalha("Planejamento não encontrado.");
                    return resposta;
                }

                var habIdsComChave = dto.Encontros
                    .Where(e => e.HabilidadeId.HasValue)
                    .Select(e => e.HabilidadeId!.Value).Distinct().ToList();
                if (habIdsComChave.Count > 0)
                {
                    var countH = await _contexto.Habilidades.CountAsync(h => habIdsComChave.Contains(h.Id));
                    if (countH != habIdsComChave.Count)
                    {
                        await transacao.RollbackAsync();
                        resposta.SetFalha("Uma ou mais habilidades informadas não existem.");
                        return resposta;
                    }
                }

                var estrIdsComChave = dto.Encontros
                    .Where(e => e.EstrategiaId.HasValue)
                    .Select(e => e.EstrategiaId!.Value).Distinct().ToList();
                if (estrIdsComChave.Count > 0)
                {
                    var countE =
                        await _contexto.Estrategias.CountAsync(e => estrIdsComChave.Contains(e.Id));
                    if (countE != estrIdsComChave.Count)
                    {
                        await transacao.RollbackAsync();
                        resposta.SetFalha("Uma ou mais estratégias informadas não existem.");
                        return resposta;
                    }
                }

                foreach (var linha in dto.Encontros)
                {
                    if (linha.DataEnc < planejamento.DataInicio || linha.DataEnc > planejamento.DataFim)
                    {
                        await transacao.RollbackAsync();
                        resposta.SetFalha(
                            "Cada encontro precisa estar com data dentro do período do PAEE (início até fim).");
                        return resposta;
                    }
                }

                var existentes =
                    await _contexto.PlanejamentoEncontros.Where(e => e.PlanejamentoId == idPlanejamento)
                        .ToListAsync();
                _contexto.PlanejamentoEncontros.RemoveRange(existentes);

                foreach (var linha in dto.Encontros)
                {
                    _contexto.PlanejamentoEncontros.Add(new PlanejamentoEncontro
                    {
                        PlanejamentoId = idPlanejamento,
                        DataEnc = linha.DataEnc,
                        TextoPlanejado = linha.TextoPlanejado,
                        TextoRealizado = linha.TextoRealizado,
                        HabilidadeId = linha.HabilidadeId,
                        EstrategiaId = linha.EstrategiaId,
                    });
                }

                await _contexto.SaveChangesAsync();
                await transacao.CommitAsync();
                resposta.Sucesso = true;
                resposta.AdicionaObjeto(true);
                resposta.AdicionaMensagem("Encontros atualizados com sucesso.");
                return resposta;
            }
            catch (Exception ex)
            {
                await transacao.RollbackAsync();
                resposta.SetFalha(ex.Message);
                return resposta;
            }
        }

        public async Task<ServiceResponse<PaeeSugestaoDatasDTO>> SugerirDatasEncontro(int idPlanejamento,
            Usuario usuario)
        {
            var resposta = new ServiceResponse<PaeeSugestaoDatasDTO>();
            try
            {
                var professorId = (int)usuario.ProfessorId!;
                var planoCtx = await _contexto.Planejamentos.AsNoTracking()
                    .Where(p => p.ID == idPlanejamento && p.IdProfessor == professorId)
                    .Select(p => new { p.DataInicio, p.DataFim })
                    .FirstOrDefaultAsync();
                if (planoCtx == null)
                {
                    resposta.SetFalha("Planejamento não encontrado.");
                    return resposta;
                }

                var alunoPrim = await _contexto.AlunosXPlanejamentos
                    .Where(ax => ax.PlanejamentoId == idPlanejamento)
                    .Join(_contexto.Alunos.Where(a => a.IdProfessor == professorId), ax => ax.AlunoId, a => a.Id,
                        (_, a) => a)
                    .OrderBy(a => a.NomeCompleto)
                    .Select(a => new { a.FrequenciaSemanalAtendimento, a.DiasSemanaAtendimentoJson })
                    .FirstOrDefaultAsync();

                if (alunoPrim == null)
                {
                    resposta.AdicionaObjeto(new PaeeSugestaoDatasDTO());
                    resposta.AdicionaMensagem(
                        "Nenhum aluno vinculado ao PAEE: não há base para sugerir datas de encontros.");
                    return resposta;
                }

                var diasBrutos =
                    PaeeDatasSugeridasGerador.DeserializarDiasDaSemana(alunoPrim.DiasSemanaAtendimentoJson);

                var lista = PaeeDatasSugeridasGerador
                    .Sugerir(planoCtx.DataInicio, planoCtx.DataFim, diasBrutos,
                        alunoPrim.FrequenciaSemanalAtendimento)
                    .ToList();

                resposta.AdicionaObjeto(new PaeeSugestaoDatasDTO { Datas = lista });
                return resposta;
            }
            catch (Exception ex)
            {
                resposta.SetFalha(ex.Message);
                return resposta;
            }
        }

        public async Task<ServiceResponse<bool>> Excluir(int id, Usuario usuario)
        {
            var resposta = new ServiceResponse<bool>();
            try
            {
                var planejamento = await _contexto.Planejamentos
                    .FirstOrDefaultAsync(p => p.ID == id && p.IdProfessor == usuario.ProfessorId);

                if (planejamento == null)
                {
                    resposta.SetFalha("Planejamento não encontrado.");
                    return resposta;
                }

                using var transacao = await _contexto.Database.BeginTransactionAsync();

                // Remove vínculos explicitamente: em produção as FKs podem ser NO ACTION / RESTRICT
                // (schema legado), impedindo delete em cascata só com Remove do pai.
                var vinculosAlunos = await _contexto.AlunosXPlanejamentos
                    .Where(x => x.PlanejamentoId == id)
                    .ToListAsync();
                _contexto.AlunosXPlanejamentos.RemoveRange(vinculosAlunos);

                var vinculosHabilidades = await _contexto.HabilidadesXPlanejamentos
                    .Where(x => x.PlanejamentoId == id)
                    .ToListAsync();
                _contexto.HabilidadesXPlanejamentos.RemoveRange(vinculosHabilidades);

                var vinculosEstrategias = await _contexto.EstrategiasXPlanejamentos
                    .Where(x => x.PlanejamentoId == id)
                    .ToListAsync();
                _contexto.EstrategiasXPlanejamentos.RemoveRange(vinculosEstrategias);

                var vinculosAvaliacoes = await _contexto.AvaliacaoXPlanejamento
                    .Where(x => x.PlanejamentoId == id)
                    .ToListAsync();
                _contexto.AvaliacaoXPlanejamento.RemoveRange(vinculosAvaliacoes);

                _contexto.Planejamentos.Remove(planejamento);
                await _contexto.SaveChangesAsync();
                await transacao.CommitAsync();

                resposta.Sucesso = true;
                resposta.AdicionaObjeto(true);
                resposta.AdicionaMensagem("Planejamento excluído com sucesso.");
                return resposta;
            }
            catch (Exception ex)
            {
                resposta.SetFalha(ex.Message);
                return resposta;
            }
        }

        public async Task<ServiceResponse<bool>> VincularAluno(PlanejamentoVincularAlunoDTO planejamentoVincularAlunoDto, Usuario usuario)
        {
            var planejamento = await _contexto.Planejamentos
                .FirstOrDefaultAsync(p =>
                    p.ID == planejamentoVincularAlunoDto.IdPlanejamento &&
                    p.IdProfessor == usuario.ProfessorId);
            var aluno = await _contexto.Alunos
                .FirstOrDefaultAsync(a =>
                    a.Id == planejamentoVincularAlunoDto.IdAluno &&
                    a.IdProfessor == usuario.ProfessorId);
            var resposta = new ServiceResponse<bool>();
            if (planejamento == null)
            {
                resposta.SetFalha("Planejamento não encontrado.");
                return resposta;
            }

            if (aluno == null)
            {
                resposta.SetFalha("Aluno não encontrado.");
                return resposta;
            }

            bool jaVinculado = await _contexto.AlunosXPlanejamentos
                .AnyAsync(x => x.AlunoId == planejamentoVincularAlunoDto.IdAluno && x.PlanejamentoId == planejamentoVincularAlunoDto.IdPlanejamento);

            if (jaVinculado)
            {
                resposta.SetFalha("Este aluno já está vinculado a esse planejamento.");
                return resposta;
            }

            var overlap = await ObterMensagemOverlapAoVincularAlunoAsync((int)usuario.ProfessorId!,
                planejamentoVincularAlunoDto.IdPlanejamento, planejamentoVincularAlunoDto.IdAluno);
            if (overlap != null)
            {
                resposta.SetFalha(overlap);
                return resposta;
            }

            var vinculo = new AlunosXPlanejamento
            {
                AlunoId = planejamentoVincularAlunoDto.IdAluno,
                PlanejamentoId = planejamentoVincularAlunoDto.IdPlanejamento
            };

            _contexto.AlunosXPlanejamentos.Add(vinculo);
            await _contexto.SaveChangesAsync();
            resposta.Sucesso = true;
            return resposta;
        }

        public async Task<ServiceResponse<bool>> VincularHabilidade(PlanejamentoVincularHabilidadeDTO planejamentoVincularHabilidadeDTO, Usuario usuario)
        {
            var planejamento = await _contexto.Planejamentos
                .FirstOrDefaultAsync(p =>
                    p.ID == planejamentoVincularHabilidadeDTO.IdPlanejamento &&
                    p.IdProfessor == usuario.ProfessorId);
            var habilidade = await _contexto.Habilidades
                .FirstOrDefaultAsync(a =>
                    a.Id == planejamentoVincularHabilidadeDTO.IdHabilidade);
            var resposta = new ServiceResponse<bool>();
            if (planejamento == null)
            {
                resposta.SetFalha("Planejamento não encontrado.");
                return resposta;
            }

            if (habilidade == null)
            {
                resposta.SetFalha("Habilidade não encontrada.");
                return resposta;
            }

            bool jaVinculado = await _contexto.HabilidadesXPlanejamentos
                .AnyAsync(x => x.HabilidadeId == planejamentoVincularHabilidadeDTO.IdHabilidade && x.PlanejamentoId == planejamentoVincularHabilidadeDTO.IdPlanejamento);

            if (jaVinculado)
            {
                resposta.SetFalha("Esta habilidade já está vinculada a esse planejamento.");
                return resposta;
            }

            var vinculo = new HabilidadesXPlanejamento()
            {
                HabilidadeId = planejamentoVincularHabilidadeDTO.IdHabilidade,
                PlanejamentoId = planejamentoVincularHabilidadeDTO.IdPlanejamento
            };

            _contexto.HabilidadesXPlanejamentos.Add(vinculo);
            await _contexto.SaveChangesAsync();
            resposta.Sucesso = true;
            return resposta;
        }

        public async Task<ServiceResponse<bool>> DesvincularHabilidade(
            PlanejamentoVincularHabilidadeDTO planejamentoVincularHabilidadeDTO,
            Usuario usuario)
        {
            var resposta = new ServiceResponse<bool>();
            var planejamento = await _contexto.Planejamentos
                .FirstOrDefaultAsync(p =>
                    p.ID == planejamentoVincularHabilidadeDTO.IdPlanejamento &&
                    p.IdProfessor == usuario.ProfessorId);

            if (planejamento == null)
            {
                resposta.SetFalha("Planejamento não encontrado.");
                return resposta;
            }

            var vinculo = await _contexto.HabilidadesXPlanejamentos
                .FirstOrDefaultAsync(x =>
                    x.HabilidadeId == planejamentoVincularHabilidadeDTO.IdHabilidade &&
                    x.PlanejamentoId == planejamentoVincularHabilidadeDTO.IdPlanejamento);

            if (vinculo == null)
            {
                resposta.SetFalha("Esta habilidade não está vinculada a esse planejamento.");
                return resposta;
            }

            _contexto.HabilidadesXPlanejamentos.Remove(vinculo);

            var encontrosComHabilidade = await _contexto.PlanejamentoEncontros
                .Where(e =>
                    e.PlanejamentoId == planejamentoVincularHabilidadeDTO.IdPlanejamento &&
                    e.HabilidadeId == planejamentoVincularHabilidadeDTO.IdHabilidade)
                .ToListAsync();

            foreach (var encontro in encontrosComHabilidade)
                encontro.HabilidadeId = null;

            await _contexto.SaveChangesAsync();
            resposta.Sucesso = true;
            resposta.AdicionaMensagem("Habilidade desvinculada com sucesso.");
            return resposta;
        }

        public async Task<ServiceResponse<bool>> VincularEstrategias(PlanejamentoVincularEstrategiaDTO planejamentoVincularEstrategiaDTO, Usuario usuario)
        {
            var planejamento = await _contexto.Planejamentos
                .FirstOrDefaultAsync(p =>
                    p.ID == planejamentoVincularEstrategiaDTO.IdPlanejamento &&
                    p.IdProfessor == usuario.ProfessorId);
            var estrategias = await _contexto.Estrategias
                .FirstOrDefaultAsync(a =>
                    a.Id == planejamentoVincularEstrategiaDTO.IdEstrategia);
            var resposta = new ServiceResponse<bool>();
            if (planejamento == null)
            {
                resposta.SetFalha("Planejamento não encontrado.");
                return resposta;
            }

            if (estrategias == null)
            {
                resposta.SetFalha("Estratégia não encontrada.");
                return resposta;
            }

            bool jaVinculado = await _contexto.EstrategiasXPlanejamentos
                .AnyAsync(x => x.EstrategiaId == planejamentoVincularEstrategiaDTO.IdEstrategia && x.PlanejamentoId == planejamentoVincularEstrategiaDTO.IdPlanejamento);

            if (jaVinculado)
            {
                resposta.SetFalha("Esta estratégia já está vinculada a esse planejamento.");
                return resposta;
            }

            var vinculo = new EstrategiasXPlanejamento()
            {
                EstrategiaId = planejamentoVincularEstrategiaDTO.IdEstrategia,
                PlanejamentoId = planejamentoVincularEstrategiaDTO.IdPlanejamento
            };

            _contexto.EstrategiasXPlanejamentos.Add(vinculo);
            await _contexto.SaveChangesAsync();
            resposta.Sucesso = true;
            return resposta;
        }

        public async Task<ServiceResponse<bool>> VincularAvaliacoes(PlanejamentoVincularAvaliacaoDTO planejamentoVincularAvaliacaoDTO, Usuario usuario)
        {
            var planejamento = await _contexto.Planejamentos
                .FirstOrDefaultAsync(p =>
                    p.ID == planejamentoVincularAvaliacaoDTO.IdPlanejamento &&
                    p.IdProfessor == usuario.ProfessorId);
            var avaliacoes = await _contexto.Avaliacao
                .FirstOrDefaultAsync(a =>
                    a.Id == planejamentoVincularAvaliacaoDTO.IdAvaliacao);
            var resposta = new ServiceResponse<bool>();
            if (planejamento == null)
            {
                resposta.SetFalha("Planejamento não encontrado.");
                return resposta;
            }

            if (avaliacoes == null)
            {
                resposta.SetFalha("Estratégia não encontrada.");
                return resposta;
            }

            bool jaVinculado = await _contexto.AvaliacaoXPlanejamento
                .AnyAsync(x => x.AvaliacaoId == planejamentoVincularAvaliacaoDTO.IdAvaliacao && x.PlanejamentoId == planejamentoVincularAvaliacaoDTO.IdPlanejamento);

            if (jaVinculado)
            {
                resposta.SetFalha("Esta estratégia já está vinculada a esse planejamento.");
                return resposta;
            }

            var vinculo = new AvaliacaoXPlanejamento()
            {
                AvaliacaoId = planejamentoVincularAvaliacaoDTO.IdAvaliacao,
                PlanejamentoId = planejamentoVincularAvaliacaoDTO.IdPlanejamento
            };

            _contexto.AvaliacaoXPlanejamento.Add(vinculo);
            await _contexto.SaveChangesAsync();
            resposta.Sucesso = true;
            return resposta;
        }

        public async Task<ServiceResponse<bool>> VincularAlunosEmLote(PlanejamentoVincularAlunosLoteDTO dto, Usuario usuario)
        {
            var resposta = new ServiceResponse<bool>();
            var distinctIds = dto.IdAlunos.Distinct().ToList();
            if (distinctIds.Count == 0)
            {
                resposta.SetFalha("Informe pelo menos um aluno.");
                return resposta;
            }

            var planejamento = await _contexto.Planejamentos
                .FirstOrDefaultAsync(p => p.ID == dto.IdPlanejamento && p.IdProfessor == usuario.ProfessorId);
            if (planejamento == null)
            {
                resposta.SetFalha("Planejamento não encontrado.");
                return resposta;
            }

            var alunosEncontrados = await _contexto.Alunos
                .Where(a => distinctIds.Contains(a.Id) && a.IdProfessor == usuario.ProfessorId)
                .Select(a => a.Id)
                .ToListAsync();
            if (alunosEncontrados.Count != distinctIds.Count)
            {
                resposta.SetFalha("Um ou mais alunos não foram encontrados.");
                return resposta;
            }

            var jaVinculados = await _contexto.AlunosXPlanejamentos
                .Where(x => x.PlanejamentoId == dto.IdPlanejamento && distinctIds.Contains(x.AlunoId))
                .Select(x => x.AlunoId)
                .ToListAsync();
            var setJa = jaVinculados.ToHashSet();
            var professorId = (int)usuario.ProfessorId!;
            foreach (var alunoId in distinctIds.Where(id => !setJa.Contains(id)))
            {
                var overlap = await ObterMensagemOverlapAoVincularAlunoAsync(professorId, dto.IdPlanejamento, alunoId);
                if (overlap != null)
                {
                    resposta.SetFalha(overlap);
                    return resposta;
                }

                _contexto.AlunosXPlanejamentos.Add(new AlunosXPlanejamento
                {
                    AlunoId = alunoId,
                    PlanejamentoId = dto.IdPlanejamento
                });
            }

            await _contexto.SaveChangesAsync();
            resposta.Sucesso = true;
            return resposta;
        }

        public async Task<ServiceResponse<bool>> VincularHabilidadesEmLote(PlanejamentoVincularHabilidadesLoteDTO dto, Usuario usuario)
        {
            var resposta = new ServiceResponse<bool>();
            var distinctIds = dto.IdHabilidades.Distinct().ToList();
            if (distinctIds.Count == 0)
            {
                resposta.Sucesso = true;
                return resposta;
            }

            var planejamento = await _contexto.Planejamentos
                .FirstOrDefaultAsync(p => p.ID == dto.IdPlanejamento && p.IdProfessor == usuario.ProfessorId);
            if (planejamento == null)
            {
                resposta.SetFalha("Planejamento não encontrado.");
                return resposta;
            }

            var encontradas = await _contexto.Habilidades
                .Where(h => distinctIds.Contains(h.Id))
                .Select(h => h.Id)
                .ToListAsync();
            if (encontradas.Count != distinctIds.Count)
            {
                resposta.SetFalha("Uma ou mais habilidades não foram encontradas.");
                return resposta;
            }

            var jaVinculados = await _contexto.HabilidadesXPlanejamentos
                .Where(x => x.PlanejamentoId == dto.IdPlanejamento && distinctIds.Contains(x.HabilidadeId))
                .Select(x => x.HabilidadeId)
                .ToListAsync();
            var setJa = jaVinculados.ToHashSet();
            foreach (var hid in distinctIds.Where(id => !setJa.Contains(id)))
            {
                _contexto.HabilidadesXPlanejamentos.Add(new HabilidadesXPlanejamento
                {
                    HabilidadeId = hid,
                    PlanejamentoId = dto.IdPlanejamento
                });
            }

            await _contexto.SaveChangesAsync();
            resposta.Sucesso = true;
            return resposta;
        }

        public async Task<ServiceResponse<bool>> VincularEstrategiasEmLote(PlanejamentoVincularEstrategiasLoteDTO dto, Usuario usuario)
        {
            var resposta = new ServiceResponse<bool>();
            var distinctIds = dto.IdEstrategias.Distinct().ToList();
            if (distinctIds.Count == 0)
            {
                resposta.Sucesso = true;
                return resposta;
            }

            var planejamento = await _contexto.Planejamentos
                .FirstOrDefaultAsync(p => p.ID == dto.IdPlanejamento && p.IdProfessor == usuario.ProfessorId);
            if (planejamento == null)
            {
                resposta.SetFalha("Planejamento não encontrado.");
                return resposta;
            }

            var encontradas = await _contexto.Estrategias
                .Where(e => distinctIds.Contains(e.Id))
                .Select(e => e.Id)
                .ToListAsync();
            if (encontradas.Count != distinctIds.Count)
            {
                resposta.SetFalha("Uma ou mais estratégias não foram encontradas.");
                return resposta;
            }

            var jaVinculados = await _contexto.EstrategiasXPlanejamentos
                .Where(x => x.PlanejamentoId == dto.IdPlanejamento && distinctIds.Contains(x.EstrategiaId))
                .Select(x => x.EstrategiaId)
                .ToListAsync();
            var setJa = jaVinculados.ToHashSet();
            foreach (var eid in distinctIds.Where(id => !setJa.Contains(id)))
            {
                _contexto.EstrategiasXPlanejamentos.Add(new EstrategiasXPlanejamento
                {
                    EstrategiaId = eid,
                    PlanejamentoId = dto.IdPlanejamento
                });
            }

            await _contexto.SaveChangesAsync();
            resposta.Sucesso = true;
            return resposta;
        }

        public async Task<ServiceResponse<bool>> VincularAvaliacoesEmLote(PlanejamentoVincularAvaliacoesLoteDTO dto, Usuario usuario)
        {
            var resposta = new ServiceResponse<bool>();
            var distinctIds = dto.IdAvaliacoes.Distinct().ToList();
            if (distinctIds.Count == 0)
            {
                resposta.Sucesso = true;
                return resposta;
            }

            var planejamento = await _contexto.Planejamentos
                .FirstOrDefaultAsync(p => p.ID == dto.IdPlanejamento && p.IdProfessor == usuario.ProfessorId);
            if (planejamento == null)
            {
                resposta.SetFalha("Planejamento não encontrado.");
                return resposta;
            }

            var encontradas = await _contexto.Avaliacao
                .Where(a => distinctIds.Contains(a.Id))
                .Select(a => a.Id)
                .ToListAsync();
            if (encontradas.Count != distinctIds.Count)
            {
                resposta.SetFalha("Uma ou mais avaliações não foram encontradas.");
                return resposta;
            }

            var jaVinculados = await _contexto.AvaliacaoXPlanejamento
                .Where(x => x.PlanejamentoId == dto.IdPlanejamento && distinctIds.Contains(x.AvaliacaoId))
                .Select(x => x.AvaliacaoId)
                .ToListAsync();
            var setJa = jaVinculados.ToHashSet();
            foreach (var aid in distinctIds.Where(id => !setJa.Contains(id)))
            {
                _contexto.AvaliacaoXPlanejamento.Add(new AvaliacaoXPlanejamento
                {
                    AvaliacaoId = aid,
                    PlanejamentoId = dto.IdPlanejamento
                });
            }

            await _contexto.SaveChangesAsync();
            resposta.Sucesso = true;
            return resposta;
        }

        public async Task<ServiceResponse<PaeeObjetivoCatalogoDTO>> ListarObjetivosCatalogoAsync()
        {
            var resposta = new ServiceResponse<PaeeObjetivoCatalogoDTO>();
            try
            {
                var itens = await _contexto.PaeeObjetivosCatalogo
                    .OrderBy(o => o.Prazo)
                    .ThenBy(o => o.OrdemExibicao)
                    .Select(o => new PaeeObjetivoCatalogoDTO
                    {
                        Id = o.Id,
                        Codigo = o.Codigo,
                        Rotulo = o.Rotulo,
                        TextoModelo = o.TextoModelo,
                        Prazo = o.Prazo.ToString(),
                        OrdemExibicao = o.OrdemExibicao,
                    })
                    .ToListAsync();
                resposta.AdicionaObjetos(itens);
                resposta.Sucesso = true;
                return resposta;
            }
            catch (Exception ex)
            {
                resposta.SetFalha(ex.Message);
                return resposta;
            }
        }
    }
}
