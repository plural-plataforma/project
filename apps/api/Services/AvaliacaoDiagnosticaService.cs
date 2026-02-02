using api.DTOs.AvaliacaoDiagnostica;
using api.DTOs.Bloco; // Para BlocoComAtividadesDTO
using api.DTOs.Atividade; // Para AtividadeBuscarDTO (ajuste se necessário)
using api.Models;
using api.Responses;
using Data;
using Microsoft.EntityFrameworkCore;

namespace api.Services
{
    public class AvaliacaoDiagnosticaService
    {
        private readonly AppDbContext _contexto;

        public AvaliacaoDiagnosticaService(AppDbContext contexto)
        {
            _contexto = contexto;
        }

        public async Task<ServiceResponse<List<AvaliacaoDiagnosticaBuscarDTO>>> GetAll()
        {
            var resposta = new ServiceResponse<List<AvaliacaoDiagnosticaBuscarDTO>>();
            try
            {
                var avaliacoes = await _contexto.AvaliacoesDiagnosticas
                    .Select(a => new AvaliacaoDiagnosticaBuscarDTO
                    {
                        Id = a.Id,
                        Titulo = a.Titulo,
                        Objetivo = a.Objetivo,
                        DataAplicacao = a.DataAplicacao,
                        EscolaId = a.EscolaId ?? 0 ,
                        Concluida = a.Concluida
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

        public async Task<ServiceResponse<List<AvaliacaoDiagnosticaBuscarDTO>>> GetNaoConcluidas()
        {
            var resposta = new ServiceResponse<List<AvaliacaoDiagnosticaBuscarDTO>>();
            try
            {
                var avaliacoes = await _contexto.AvaliacoesDiagnosticas
                    .Where(a => !a.Concluida)
                    .Select(a => new AvaliacaoDiagnosticaBuscarDTO
                    {
                        Id = a.Id,
                        Titulo = a.Titulo,
                        Objetivo = a.Objetivo,
                        DataAplicacao = a.DataAplicacao,
                        EscolaId = a.EscolaId ?? 0,
                        Concluida = a.Concluida
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

        // Método auxiliar para montar o DTO detalhado (usado em Create, Update e GetById)
        private async Task<AvaliacaoDiagnosticaDetailDTO> MontarDetailDTO(int avaliacaoId)
        {
            var avaliacao = await _contexto.AvaliacoesDiagnosticas
                .Include(a => a.BlocosSelecionados).ThenInclude(b => b.Bloco)
                .Include(a => a.AtividadesSelecionadas).ThenInclude(aa => aa.Atividade)
                .Include(a => a.AlunosParticipantes)
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
                            // Adicione aqui os outros campos do seu AtividadeBuscarDTO
                            // Exemplo: Descricao = aa.Atividade.Descricao,
                            //          Tipo = aa.Atividade.Tipo,
                            // etc.
                        })
                        .ToList()
                })
                .ToList();

            return new AvaliacaoDiagnosticaDetailDTO
            {
                Id = avaliacao.Id,
                Titulo = avaliacao.Titulo,
                Objetivo = avaliacao.Objetivo,
                DataAplicacao = avaliacao.DataAplicacao,
                EscolaId = avaliacao.EscolaId,
                Concluida = avaliacao.Concluida,
                AlunoIds = avaliacao.AlunosParticipantes.Select(ap => ap.AlunoId).ToList(),
                BlocosComAtividades = blocosOrdenados
            };
        }

        public async Task<ServiceResponse<AvaliacaoDiagnosticaDetailDTO>> Create(AvaliacaoDiagnosticaDTO dto)
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

                if (dto.EscolaId.HasValue)
                {
                    var escolaExiste = await _contexto.EscolasXProfessores
                        .AnyAsync(e => e.EscolaId == dto.EscolaId.Value);

                    if (!escolaExiste)
                    {
                        resposta.SetFalha("Escola informada não existe.");
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

                var avaliacao = new AvaliacaoDiagnostica
                {
                    Titulo = dto.Titulo.Trim(),
                    Objetivo = dto.Objetivo?.Trim(),
                    DataAplicacao = dto.DataAplicacao ?? DateTime.UtcNow.Date,
                    EscolaId = dto.EscolaId,
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
                resposta.SetFalha("Erro ao criar avaliação diagnóstica: " + ex.Message);
                return resposta;
            }
        }

        public async Task<ServiceResponse<AvaliacaoDiagnosticaDetailDTO>> GetById(int id)
        {
            var resposta = new ServiceResponse<AvaliacaoDiagnosticaDetailDTO>();
            try
            {
                var avaliacaoExiste = await _contexto.AvaliacoesDiagnosticas.AnyAsync(a => a.Id == id);
                if (!avaliacaoExiste)
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

        public async Task<ServiceResponse<AvaliacaoDiagnosticaDetailDTO>> Update(int id, UpdateAvaliacaoDiagnosticaDTO dto)
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
                    .FirstOrDefaultAsync(a => a.Id == id);

                if (avaliacao == null)
                {
                    resposta.SetFalha($"Avaliação diagnóstica com ID {id} não encontrada.");
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
                    var escolaExiste = await _contexto.EscolasXProfessores
                        .AnyAsync(e => e.EscolaId == dto.EscolaId.Value);

                    if (!escolaExiste)
                    {
                        resposta.SetFalha("Escola informada não existe.");
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
    }
}