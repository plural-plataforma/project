using api.DTOs.Aluno;
using api.DTOs.Avaliacao;
using api.DTOs.Estrategia;
using api.DTOs.Habilidade;
using api.DTOs.Laudo;
using api.DTOs.Planejamento;
using api.DTOs.Responsavel;
using api.Models;
using api.Responses;
using Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace api.Services
{
    public class AlunoService
    {
        private readonly AppDbContext _contexto;
        private readonly UserManager<Usuario> _usuario;

        public AlunoService(AppDbContext contexto, UserManager<Usuario> usuario)
        {
            _contexto = contexto;
            _usuario = usuario;
        }

        public async Task<ServiceResponse<AlunoCadastroDTO>> Cadastro(AlunoCadastroDTO alunoDTO, Usuario usuario)
        {
            var resposta = new ServiceResponse<AlunoCadastroDTO>();
            using (var transacao = await _contexto.Database.BeginTransactionAsync())
            {
                try
                {
                    Responsavel responsavel = new Responsavel()
                    {
                        NomeCompleto = alunoDTO.Responsavel.NomeCompleto,
                        Telefone = alunoDTO.Responsavel.Telefone,
                        Email = alunoDTO.Responsavel.Email
                    };

                    _contexto.Responsaveis.Add(responsavel);
                    await _contexto.SaveChangesAsync();

                    Aluno aluno = new Aluno
                    {
                        NomeCompleto = alunoDTO.NomeCompleto,
                        Cep = alunoDTO.Cep,
                        Logradouro = alunoDTO.Logradouro,
                        Numero = alunoDTO.Numero.HasValue ? (int)alunoDTO.Numero : 0,
                        Complemento = alunoDTO.Complemento,
                        Bairro = alunoDTO.Bairro,
                        Estado = alunoDTO.Estado,
                        Cidade = alunoDTO.Cidade,
                        Telefone = alunoDTO.Telefone,
                        NivelEnsino = alunoDTO.NivelEnsino,
                        Ano = alunoDTO.Ano,
                        Turno = alunoDTO.Turno,
                        Sexo = alunoDTO.Sexo,
                        IdEscola = alunoDTO.IdEscola,
                        IdProfessor = usuario.ProfessorId ?? 0,
                        IdResponsavel = responsavel.Id
                    };
                    _contexto.Alunos.Add(aluno);
                    await _contexto.SaveChangesAsync();

                    if (alunoDTO.Laudos != null && alunoDTO.Laudos.Any())
                    {
                        var laudos = alunoDTO.Laudos.Select(l => new Laudo
                        {
                            CodigoCid = l.CodigoCid,
                            NomeMedico = l.NomeMedico,
                            Descricao = l.Descricao,
                            IdAluno = aluno.Id
                        }).ToList();

                        _contexto.Laudos.AddRange(laudos);
                        await _contexto.SaveChangesAsync();
                    }

                    await transacao.CommitAsync();
                    resposta.Sucesso = true;
                    return resposta;
                }
                catch (Exception)
                {

                    await transacao.RollbackAsync();
                    resposta.SetFalha("Erro ao cadastrar aluno.");
                    throw;
                }
            }

        }
        
        public async Task<ServiceResponse<AlunoAtualizarDTO>> Atualizar(Usuario usuario, AlunoAtualizarDTO alunoDTO)
        {
            var resposta = new ServiceResponse<AlunoAtualizarDTO>();

            try
            {
                Aluno aluno = await _contexto.Alunos.FirstOrDefaultAsync(a => a.Id == alunoDTO.Id && a.IdProfessor == usuario.ProfessorId);
                if (aluno == null)
                {
                    resposta.SetFalha("Aluno não encontrado.");
                    return resposta;
                }

                if (!string.IsNullOrEmpty(alunoDTO.NomeCompleto))
                {
                    aluno.NomeCompleto = alunoDTO.NomeCompleto;
                }

                if (!string.IsNullOrEmpty(alunoDTO.Cep))
                {
                    aluno.Cep = alunoDTO.Cep;
                }

                if (!string.IsNullOrEmpty(alunoDTO.Logradouro))
                {
                    aluno.Logradouro = alunoDTO.Logradouro;
                }

                if (alunoDTO.Numero.HasValue)
                {
                    aluno.Numero = (int)alunoDTO.Numero;
                }

                if (!string.IsNullOrEmpty(alunoDTO.Complemento))
                {
                    aluno.Complemento = alunoDTO.Complemento;
                }

                if (!string.IsNullOrEmpty(alunoDTO.Bairro))
                {
                    aluno.Bairro = alunoDTO.Bairro;
                }

                if (!string.IsNullOrEmpty(alunoDTO.Estado))
                {
                    aluno.Estado = alunoDTO.Estado;
                }

                if (!string.IsNullOrEmpty(alunoDTO.Cidade))
                {
                    aluno.Cidade = alunoDTO.Cidade;
                }

                if (!string.IsNullOrEmpty(alunoDTO.Telefone))
                {
                    aluno.Telefone = alunoDTO.Telefone;
                }

                if (!string.IsNullOrEmpty(alunoDTO.NivelEnsino))
                {
                    aluno.NivelEnsino = alunoDTO.NivelEnsino;
                }

                if (!string.IsNullOrEmpty(alunoDTO.Ano))
                {
                    aluno.Ano = alunoDTO.Ano;
                }
                if (!string.IsNullOrEmpty(alunoDTO.Turno))
                {
                    aluno.Turno = alunoDTO.Turno;
                }
                if (alunoDTO.IdEscola != 0)
                {
                    aluno.IdEscola = (int)alunoDTO.IdEscola;
                }
                if (!string.IsNullOrEmpty(alunoDTO.Sexo))
                {
                    aluno.Sexo = alunoDTO.Sexo;
                }

                await _contexto.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                resposta.SetFalha(ex.Message);
                return resposta;
            }

            resposta.AdicionaMensagem("Cadastro de aluno atualizado com sucesso.");
            return resposta;
        }



        public async Task<ServiceResponse<List<AlunoBuscarDTO>>> Buscar(Usuario usuario)
        {
            var resposta = new ServiceResponse<List<AlunoBuscarDTO>>();
            try
            {
                var alunos = await _contexto.Alunos
                    .Where(a => a.IdProfessor == usuario.ProfessorId)
                    .Select(a => new AlunoBuscarDTO
                    {
                        Id = a.Id,
                        NomeCompleto = a.NomeCompleto,
                        Cep = a.Cep,
                        Logradouro = a.Logradouro,
                        Numero = a.Numero,
                        Complemento = a.Complemento,
                        Bairro = a.Bairro,
                        Estado = a.Estado,
                        Cidade = a.Cidade,
                        Telefone = a.Telefone,
                        IdEscola = a.IdEscola,
                        NivelEnsino = a.NivelEnsino,
                        Ano = a.Ano,
                        Turno = a.Turno,
                        Sexo = a.Sexo,

                        Responsavel = a.Responsavel != null
                            ? new ResponsavelCadastroSimplificadoDTO
                            {
                                NomeCompleto = a.Responsavel.NomeCompleto,
                                Telefone = a.Responsavel.Telefone,
                                Email = a.Responsavel.Email
                            }
                            : null,

                        Laudos = a.Laudos != null
                            ? a.Laudos.Select(l => new LaudoCadastroSimplificadoDTO
                            {
                                CodigoCid = l.CodigoCid,
                                NomeMedico = l.NomeMedico,
                                Descricao = l.Descricao
                            }).ToList()
                            : new List<LaudoCadastroSimplificadoDTO>(),
                        Planejamentos = a.AlunosXPlanejamentos != null
                            ? a.AlunosXPlanejamentos.Select(axp => new PlanejamentoBuscarSimplificadoDTO
                            {
                                Id = axp.Planejamento.ID,
                                Apelido = axp.Planejamento.Apelido,
                                DataInicio = axp.Planejamento.DataInicio,
                                DataFim = axp.Planejamento.DataFim,
                                Habilidades = axp.Planejamento.HabilidadesXPlanejamentos
                                    .Select(hxp => new HabilidadeBuscarDTO
                                    {
                                        Id = hxp.Habilidade.Id,
                                        Descricao = hxp.Habilidade.Descricao
                                    })
                                    .ToList(),
                                Estrategias = axp.Planejamento.EstrategiasXPlanejamentos
                                    .Select(hxp => new EstrategiaBuscarDTO
                                    {
                                        Id = hxp.Estrategia.Id,
                                        Descricao = hxp.Estrategia.Descricao
                                    })
                                    .ToList(),
                                Avaliacao = axp.Planejamento.AvaliacaoXPlanejamentos
                                    .Select(hxp => new AvaliacaoBuscarDTO
                                    {
                                        Id = hxp.Avaliacao.Id,
                                        Descricao = hxp.Avaliacao.Descricao,
                                        Resumo = hxp.Avaliacao.Resumo
                                    })
                                    .ToList()
                            }).ToList()
                            : new List<PlanejamentoBuscarSimplificadoDTO>()
                    })
                    .ToListAsync();
                resposta.AdicionaObjeto(alunos);
                resposta.Sucesso = true;
                return resposta;
            }
            catch (Exception)
            {
                resposta.SetFalha("Erro ao buscar alunos.");
                return resposta;
            }
        }

        public async Task<ServiceResponse<AlunoBuscarDTO>> Buscar(Usuario usuario, int idAluno)
        {
            var resposta = new ServiceResponse<AlunoBuscarDTO>();
            try
            {
                var aluno = await _contexto.Alunos
                    .Where(a => a.IdProfessor == usuario.ProfessorId && a.Id == idAluno)
                    .Select(a => new AlunoBuscarDTO
                    {
                        Id = a.Id,
                        NomeCompleto = a.NomeCompleto,
                        Cep = a.Cep,
                        Logradouro = a.Logradouro,
                        Numero = a.Numero,
                        Complemento = a.Complemento,
                        Bairro = a.Bairro,
                        Estado = a.Estado,
                        Cidade = a.Cidade,
                        Telefone = a.Telefone,
                        IdEscola = a.IdEscola,
                        NivelEnsino = a.NivelEnsino,
                        Ano = a.Ano,
                        Turno = a.Turno,
                        Sexo = a.Sexo,

                        Responsavel = a.Responsavel != null
                            ? new ResponsavelCadastroSimplificadoDTO
                            {
                                NomeCompleto = a.Responsavel.NomeCompleto,
                                Telefone = a.Responsavel.Telefone,
                                Email = a.Responsavel.Email
                            }
                            : null,

                        Laudos = a.Laudos != null
                            ? a.Laudos.Select(l => new LaudoCadastroSimplificadoDTO
                            {
                                CodigoCid = l.CodigoCid,
                                NomeMedico = l.NomeMedico,
                                Descricao = l.Descricao
                            }).ToList()
                            : new List<LaudoCadastroSimplificadoDTO>(),

                        Planejamentos = a.AlunosXPlanejamentos != null
                            ? a.AlunosXPlanejamentos.Select(axp => new PlanejamentoBuscarSimplificadoDTO
                            {
                                Id = axp.Planejamento.ID,
                                Apelido = axp.Planejamento.Apelido,
                                DataInicio = axp.Planejamento.DataInicio,
                                DataFim = axp.Planejamento.DataFim,
                                Habilidades = axp.Planejamento.HabilidadesXPlanejamentos
                                    .Select(hxp => new HabilidadeBuscarDTO
                                    {
                                        Id = hxp.Habilidade.Id,
                                        Descricao = hxp.Habilidade.Descricao
                                    })
                                    .ToList(),
                                Estrategias = axp.Planejamento.EstrategiasXPlanejamentos
                                    .Select(hxp => new EstrategiaBuscarDTO
                                    {
                                        Id = hxp.Estrategia.Id,
                                        Descricao = hxp.Estrategia.Descricao
                                    })
                                    .ToList(),
                                Avaliacao = axp.Planejamento.AvaliacaoXPlanejamentos
                                    .Select(hxp => new AvaliacaoBuscarDTO
                                    {
                                        Id = hxp.Avaliacao.Id,
                                        Descricao = hxp.Avaliacao.Descricao
                                    })
                                    .ToList()
                            }).ToList()
                            : new List<PlanejamentoBuscarSimplificadoDTO>()
                    })
                    .FirstOrDefaultAsync();

                if (aluno == null)
                {
                    resposta.SetFalha("Aluno não encontrado.");
                    return resposta;
                }

                resposta.AdicionaObjeto(aluno);
                resposta.Sucesso = true;
                return resposta;
            }
            catch (Exception)
            {
                resposta.SetFalha("Erro ao buscar aluno.");
                return resposta;
            }
        }

        public async Task<ServiceResponse<bool>> Excluir(Usuario usuario, int idAluno)
        {
            var resposta = new ServiceResponse<bool>();

            try
            {
                using var transacao = await _contexto.Database.BeginTransactionAsync();

                var aluno = await _contexto.Alunos
                    .FirstOrDefaultAsync(a => a.Id == idAluno && a.IdProfessor == usuario.ProfessorId);

                if (aluno == null)
                {
                    resposta.SetFalha("Aluno não encontrado.");
                    return resposta;
                }

                var idResponsavel = aluno.IdResponsavel;

                // Remove dependências explícitas do aluno para evitar falha de FK ao excluir.
                var historicos = await _contexto.ObservacoesAlunosAvaliacaoHistorico
                    .Where(o => o.AlunoId == idAluno)
                    .ToListAsync();
                _contexto.ObservacoesAlunosAvaliacaoHistorico.RemoveRange(historicos);

                var desempenhos = await _contexto.DesempenhosAtividades
                    .Where(d => d.AlunoId == idAluno)
                    .ToListAsync();
                _contexto.DesempenhosAtividades.RemoveRange(desempenhos);

                var avaliacoesAluno = await _contexto.AvaliacoesAlunos
                    .Where(a => a.AlunoId == idAluno)
                    .ToListAsync();
                _contexto.AvaliacoesAlunos.RemoveRange(avaliacoesAluno);

                var diagnosticosFinais = await _contexto.DiagnosticosFinais
                    .Where(d => d.AlunoId == idAluno)
                    .ToListAsync();
                _contexto.DiagnosticosFinais.RemoveRange(diagnosticosFinais);

                var vinculosPlanejamento = await _contexto.AlunosXPlanejamentos
                    .Where(v => v.AlunoId == idAluno)
                    .ToListAsync();
                _contexto.AlunosXPlanejamentos.RemoveRange(vinculosPlanejamento);

                var laudos = await _contexto.Laudos
                    .Where(l => l.IdAluno == idAluno)
                    .ToListAsync();
                _contexto.Laudos.RemoveRange(laudos);

                _contexto.Alunos.Remove(aluno);
                await _contexto.SaveChangesAsync();

                if (idResponsavel.HasValue)
                {
                    var responsavelAindaEmUso = await _contexto.Alunos.AnyAsync(a => a.IdResponsavel == idResponsavel.Value);
                    if (!responsavelAindaEmUso)
                    {
                        var responsavel = await _contexto.Responsaveis.FindAsync(idResponsavel.Value);
                        if (responsavel != null)
                        {
                            _contexto.Responsaveis.Remove(responsavel);
                            await _contexto.SaveChangesAsync();
                        }
                    }
                }

                await transacao.CommitAsync();
                resposta.Sucesso = true;
                resposta.AdicionaObjeto(true);
                resposta.AdicionaMensagem("Aluno excluído com sucesso.");
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
