using api.DTOs.Aluno;
using api.DTOs.Autenticacao;
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
                        IdEscola = alunoDTO.IdEscola.HasValue ? (int)alunoDTO.IdEscola : 0,
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
        /*
        public async Task<ServiceResponse<AlunoDTO>> Atualizar(AlunoDTO professorDto, int idProfessor)
        {
            var resposta = new ServiceResponse<AlunoDTO>();

            try
            {
                Professor professor = await _contexto.Professores.FindAsync(idProfessor);
                if (professor == null)
                {
                    resposta.SetFalha("Professor não encontrado.");
                    return resposta;
                }

                if (!string.IsNullOrEmpty(professorDto.NomeCompleto))
                {
                    professor.NomeCompleto = professorDto.NomeCompleto;
                }

                if (!string.IsNullOrEmpty(professorDto.Cep))
                {
                    professor.Cep = professorDto.Cep;
                }

                if (!string.IsNullOrEmpty(professorDto.Logradouro))
                {
                    professor.Logradouro = professorDto.Logradouro;
                }

                if (professorDto.Numero.HasValue)
                {
                    professor.Numero = professorDto.Numero;
                }

                if (!string.IsNullOrEmpty(professorDto.Complemento))
                {
                    professor.Complemento = professorDto.Complemento;
                }

                if (!string.IsNullOrEmpty(professorDto.Bairro))
                {
                    professor.Bairro = professorDto.Bairro;
                }

                if (!string.IsNullOrEmpty(professorDto.Estado))
                {
                    professor.Estado = professorDto.Estado;
                }

                if (!string.IsNullOrEmpty(professorDto.Cidade))
                {
                    professor.Cidade = professorDto.Cidade;
                }

                if (!string.IsNullOrEmpty(professorDto.Telefone))
                {
                    professor.Telefone = professorDto.Telefone;
                }

                if (!string.IsNullOrEmpty(professorDto.Disciplinas))
                {
                    professor.Disciplinas = professorDto.Disciplinas;
                }

                if (!string.IsNullOrEmpty(professorDto.NivelEnsino))
                {
                    professor.NivelEnsino = professorDto.NivelEnsino;
                }

                if (!string.IsNullOrEmpty(professorDto.Sobre))
                {
                    professor.Sobre = professorDto.Sobre;
                }
                if (!string.IsNullOrEmpty(professorDto.Sexo))
                {
                    professor.Sexo = professorDto.Sexo.ToUpper();
                }

                await _contexto.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                resposta.SetFalha(ex.Message);
                return resposta;
            }

            resposta.AdicionaMensagem("Cadastro de professor atualizado com sucesso.");
            return resposta;
        }*/

        /*

        public async Task<ServiceResponse<AlunoDTO>> Buscar(Usuario usuario)
        {
            var resposta = new ServiceResponse<AlunoDTO>();

            try
            {
                Professor professor = await _contexto.Professores.FindAsync(usuario.ProfessorId);
                if (professor == null)
                {
                    resposta.SetFalha("Professor não encontrado.");
                    return resposta;
                }

                var professorDto = new AlunoDTO
                {
                    NomeCompleto = professor.NomeCompleto,
                    Sexo = professor.Sexo,
                    Cep = professor.Cep,
                    Logradouro = professor.Logradouro,
                    Numero = professor.Numero,
                    Complemento = professor.Complemento,
                    Bairro = professor.Bairro,
                    Estado = professor.Estado,
                    Cidade = professor.Cidade,
                    Telefone = professor.Telefone,
                    Disciplinas = professor.Disciplinas,
                    NivelEnsino = professor.NivelEnsino,
                    Sobre = professor.Sobre,
                    AceitouTermos = usuario.AceitouTermos,
                    Email = usuario.Email
                };
                resposta.AdicionaObjeto(professorDto);
            }
            catch (Exception ex)
            {
                resposta.SetFalha(ex.Message);
                return resposta;
            }

            return resposta;
        }*/
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
