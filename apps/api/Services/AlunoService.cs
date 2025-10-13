using api.DTOs.Aluno;
using api.DTOs.Autenticacao;
using api.DTOs.Escola;
using api.Models;
using api.Responses;
using Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel;
using System.Diagnostics;

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

        public async Task<ServiceResponse<AlunoDTO>> Cadastro(AlunoDTO alunoDTO, Usuario usuario)
        {
            var resposta = new ServiceResponse<AlunoDTO>();
            using (var transacao = await _contexto.Database.BeginTransactionAsync())
            {
                try
                {
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
                        Telefone = alunoDTO.Telefone.HasValue ? (int)alunoDTO.Telefone : 0,
                        IdEscola = alunoDTO.IdEscola,
                        NivelEnsino = alunoDTO.NivelEnsino,
                        Ano = alunoDTO.Ano,
                        Turno = alunoDTO.Turno,
                        IdProfessor = usuario.ProfessorId.HasValue ? (int)usuario.ProfessorId : 0,

                    };
                    _contexto.Alunos.Add(aluno);
                    await _contexto.SaveChangesAsync();

                    await transacao.CommitAsync();
                    resposta.Sucesso = true;
                    return resposta;
                }
                catch (Exception)
                {

                    await transacao.RollbackAsync();
                    resposta.SetFalha("Erro ao cadastrar aluno.");
                    throw;
                    return resposta;
                }
            }

        }
        
        public async Task<ServiceResponse<AlunoComIdDTO>> Atualizar(Usuario usuario, AlunoComIdDTO alunoDTO)
        {
            var resposta = new ServiceResponse<AlunoComIdDTO>();

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

                if (alunoDTO.Telefone.HasValue)
                {
                    aluno.Telefone = (int)alunoDTO.Telefone;
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
                    aluno.IdEscola = alunoDTO.IdEscola;
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



        public async Task<ServiceResponse<List<AlunoComIdDTO>>> Buscar(Usuario usuario)
        {
            var resposta = new ServiceResponse<List<AlunoComIdDTO>>();
            try
            {
                var alunos = _contexto.Alunos
                    .Where(a => a.IdProfessor == usuario.ProfessorId)
                    .Select(a => new AlunoComIdDTO
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
                        Turno = a.Turno
                    })
                    .ToList();
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

        public async Task<ServiceResponse<AlunoComIdDTO>> Buscar(Usuario usuario, int idAluno)
        {
            var resposta = new ServiceResponse<AlunoComIdDTO>();
            try
            {
                var aluno = _contexto.Alunos
                    .Where(a => a.IdProfessor == usuario.ProfessorId && a.Id == idAluno)
                    .Select(a => new AlunoComIdDTO
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
                        Turno = a.Turno
                    })
                    .FirstOrDefault();
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
        /*
        public async Task<ServiceResponse<bool>> VincularEscola(int idEscola, int idAluno)
        {
            var escola = await _contexto.Escolas.FindAsync(idEscola);
            var resposta = new ServiceResponse<bool>();
            if (escola == null)
            {
                resposta.SetFalha("Escola não encontrada.");
                return resposta;
            }

            bool jaVinculado = await _contexto.EscolasXProfessores
           .AnyAsync(x => x.EscolaId == idEscola && x.ProfessorId == idProfessor);

            if (jaVinculado)
            {
                resposta.SetFalha("Este professor já está vinculado a essa escola.");
                return resposta;
            }

            var vinculo = new EscolaXProfessor
            {
                EscolaId = idEscola,
                ProfessorId = idProfessor
            };

            _contexto.EscolasXProfessores.Add(vinculo);
            await _contexto.SaveChangesAsync();
            resposta.Sucesso = true;
            return resposta;
        }*/
    }
}
