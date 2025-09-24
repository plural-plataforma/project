using api.DTOs.Autenticacao;
using api.DTOs.Professor;
using api.Models;
using api.Responses;
using Data;
using Microsoft.AspNetCore.Identity;

namespace api.Services
{
    public class ProfessorService
    {
        private readonly AppDbContext _contexto;

        public ProfessorService(AppDbContext contexto)
        {
            _contexto = contexto;
        }

        public async Task<ServiceResponse<ProfessorDTO>> Atualizar(ProfessorDTO professorDto, int idProfessor)
        {
            var resposta = new ServiceResponse<ProfessorDTO>();

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

                await _contexto.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                resposta.SetFalha(ex.Message);
                return resposta;
            }

            resposta.AdicionaMensagem("Cadastro de professor atualizado com sucesso.");
            return resposta;
        }

        public async Task<ServiceResponse<ProfessorDTO>> Buscar(int idProfessor)
        {
            var resposta = new ServiceResponse<ProfessorDTO>();
            try
            {
                Professor professor = await _contexto.Professores.FindAsync(idProfessor);
                if (professor == null)
                {
                    resposta.SetFalha("Professor não encontrado.");
                    return resposta;
                }

                var professorDto = new ProfessorDTO
                {
                    NomeCompleto = professor.NomeCompleto,
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
                    IsCheckTerms = professor.IsCheckTerms
                };
                resposta.AdicionaObjeto(professorDto);
            }
            catch (Exception ex)
            {
                resposta.SetFalha(ex.Message);
                return resposta;
            }

            return resposta;
        }
    }
}
