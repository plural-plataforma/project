using api.DTOs.Aluno;
using api.DTOs.Estrategia;
using api.DTOs.Habilidade;
using api.DTOs.Avaliacao;
using api.DTOs.Planejamento;
using api.Models;
using api.Responses;
using Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace api.Services
{
    public class PlanejamentoService
    {
        private readonly AppDbContext _contexto;
        private readonly UserManager<Usuario> _usuario;

        public PlanejamentoService(AppDbContext contexto, UserManager<Usuario> usuario)
        {
            _contexto = contexto;
            _usuario = usuario;
        }

        public async Task<ServiceResponse<PlanejamentoCadastroDTO>> Cadastro(PlanejamentoCadastroDTO planejamentoDTO, Usuario usuario)
        {
            var resposta = new ServiceResponse<PlanejamentoCadastroDTO>();
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
                    .Where(p => p.IdProfessor == usuario.ProfessorId)
                    .Select(p => new PlanejamentoBuscarDTO
                    {
                        Id = p.ID,
                        Apelido = p.Apelido,
                        DataInicio = p.DataInicio,
                        DataFim = p.DataFim,
                        DescicaoPlanejamento = p.DescicaoPlanejamento,
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
                    .Where(p => p.ID == id && p.IdProfessor == usuario.ProfessorId)
                    .Select(p => new PlanejamentoBuscarDTO
                    {
                        Id = p.ID,
                        Apelido = p.Apelido,
                        DataInicio = p.DataInicio,
                        DataFim = p.DataFim,
                        DescicaoPlanejamento = p.DescicaoPlanejamento,
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

                _contexto.Planejamentos.Remove(planejamento);
                await _contexto.SaveChangesAsync();

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
    }
}
