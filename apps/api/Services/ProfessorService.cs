using api.DTOs.Escola;
using api.DTOs.Professor;
using api.Models;
using api.Responses;
using Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace api.Services
{
    public class ProfessorService
    {
        private readonly AppDbContext _contexto;
        private readonly UserManager<Usuario> _usuario;

        public ProfessorService(AppDbContext contexto, UserManager<Usuario> usuario)
        {
            _contexto = contexto;
            _usuario = usuario;
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
        }

        public async Task<ServiceResponse<ProfessorDTO>> Buscar(Usuario usuario)
        {
            var resposta = new ServiceResponse<ProfessorDTO>();

            try
            {
                Professor professor = await _contexto.Professores.FindAsync(usuario.ProfessorId);
                if (professor == null)
                {
                    resposta.SetFalha("Professor não encontrado.");
                    return resposta;
                }

                var professorDto = new ProfessorDTO
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
        }

        public async Task<ServiceResponse<bool>> VincularEscola(int idEscola, int idProfessor)
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
        }

        public async Task<ServiceResponse<List<EscolaComIdDTO>>> BuscarEscolas(int idProfessor)
        {
            var resposta = new ServiceResponse<List<EscolaComIdDTO>>();
            try
            {
                var escolas = _contexto.Escolas
                    .Where(e => e.EscolaXProfessores.Any(ep => ep.ProfessorId == idProfessor))
                    .Select(e => new EscolaComIdDTO
                    {
                        Id = e.ID,
                        NomeInstituicao = e.NomeInstituicao,
                        Tipo = e.Tipo,
                        Cep = e.Cep,
                        Logradouro = e.Logradouro,
                        Numero = e.Numero,
                        Complemento = e.Complemento,
                        Bairro = e.Bairro,
                        Estado = e.Estado,
                        Cidade = e.Cidade
                    })
                    .ToList();
                resposta.AdicionaObjeto(escolas);
                resposta.Sucesso = true;
                return resposta;
            }
            catch (Exception)
            {
                resposta.SetFalha("Erro ao buscar escolas.");
                return resposta;
            }
        }
    }
}
