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

        public async Task<ServiceResponse<bool>> DesvincularEscola(int idEscola, int idProfessor)
        {
            var resposta = new ServiceResponse<bool>();

            try
            {
                var vinculo = await _contexto.EscolasXProfessores
                    .FirstOrDefaultAsync(x => x.EscolaId == idEscola && x.ProfessorId == idProfessor);

                if (vinculo == null)
                {
                    resposta.SetFalha("Nenhum vínculo encontrado entre este professor e esta escola.");
                    return resposta;
                }

                _contexto.EscolasXProfessores.Remove(vinculo);
                await _contexto.SaveChangesAsync();

                resposta.Sucesso = true;
                resposta.AdicionaMensagem("Vínculo removido com sucesso.");
                return resposta;
            }
            catch (Exception ex)
            {
                resposta.SetFalha($"Erro ao desvincular escola: {ex.Message}");
                return resposta;
            }
        }

        /// <summary>
        /// Verifica quais e-mails da lista já estão cadastrados como professores na plataforma
        /// </summary>
        /// <param name="emails">Lista de e-mails para verificar (case-insensitive)</param>
        /// <returns>Dicionário: email original → true/false (se é professor cadastrado)</returns>
        public async Task<Dictionary<string, bool>> VerificarEmailsCadastradosComoProfessorAsync(IEnumerable<string> emails)
        {
            if (!emails.Any())
                return new Dictionary<string, bool>();

            // Remove vazios e normaliza para comparação (Identity usa NormalizedEmail em maiúsculo)
            var emailsValidos = emails
                .Where(e => !string.IsNullOrWhiteSpace(e))
                .Select(e => e.Trim())
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();

            if (!emailsValidos.Any())
                return new Dictionary<string, bool>();

            var normalizedEmails = emailsValidos
                .Select(e => e.ToUpperInvariant())
                .ToList();

            // Busca apenas os NormalizedEmail dos usuários que são professores
            var emailsProfessores = await _usuario.Users
                .Where(u => u.ProfessorId.HasValue && normalizedEmails.Contains(u.NormalizedEmail!))
                .Select(u => u.NormalizedEmail!)
                .ToListAsync();

            // Monta o dicionário mantendo o e-mail original como chave
            return emailsValidos
                .ToDictionary(
                    email => email,
                    email => emailsProfessores.Contains(email.ToUpperInvariant()),
                    StringComparer.OrdinalIgnoreCase
                );
        }

        public async Task<Dictionary<string, ProfessorViaEmailDTO>> BuscarViaEmail(Dictionary<string, bool> statusCadastro)
        {
            //busca apenas os emails que já possuem cadastro - informacao vem do dicionario passado por parametro
            List<string> emailsCadastrados = statusCadastro
                 .Where(x => x.Value)
                 .Select(x => x.Key)
                 .ToList();

            if (!emailsCadastrados.Any())
            {
                return new Dictionary<string, ProfessorViaEmailDTO>();

            }

            var usuarios = await _usuario.Users
                .Where(u => u.Email != null && emailsCadastrados.Contains(u.Email))
                .Select(u => new
                {
                    u.Id,
                    u.Email,
                    u.ProfessorId,
                    u.LockoutEnabled,
                    u.LockoutEnd
                })
                .ToListAsync();

            var usuariosIds = usuarios.Select(u => u.Id).ToList();

            var rolesPorUsuario = await (
                from ur in _contexto.UserRoles
                join r in _contexto.Roles on ur.RoleId equals r.Id
                where usuariosIds.Contains(ur.UserId)
                select new
                {
                    ur.UserId,
                    r.Name
                }
            ).ToListAsync();

            var rolesDicionario = rolesPorUsuario
                .GroupBy(x => x.UserId)
                .ToDictionary(
                    g => g.Key,
                    g => g.Select(x => x.Name).ToList()
                );


            List<int> professorIds = usuarios
                .Where(u => u.ProfessorId.HasValue)
                .Select(u => u.ProfessorId.Value)
                .Distinct()
                .ToList();

            if (!professorIds.Any())
            {
                return new Dictionary<string, ProfessorViaEmailDTO>();
            }

            var professores = await _contexto.Professores
                .Where(p => professorIds.Contains(p.ID))
                .Select(p => new
                {
                    p.ID,
                    p.NomeCompleto,
                    p.NivelEnsino,
                    p.Telefone
                })
                .ToListAsync();

            var professoresPorId = professores.ToDictionary(p => p.ID);

            var resultado = new Dictionary<string, ProfessorViaEmailDTO>();

            foreach (var usuario in usuarios)
            {
                if (usuario.ProfessorId.HasValue &&
                    professoresPorId.TryGetValue(usuario.ProfessorId.Value, out var professor))
                {
                    rolesDicionario.TryGetValue(usuario.Id, out var roles);
                    resultado[usuario.Email] = new ProfessorViaEmailDTO
                    {
                        Email = usuario.Email,
                        ProfessorId = professor.ID,
                        NomeCompleto = professor.NomeCompleto,
                        NivelEnsino = professor.NivelEnsino,
                        Telefone = professor.Telefone,
                        Ativo = !usuario.LockoutEnd.HasValue || usuario.LockoutEnd <= DateTimeOffset.UtcNow,
                        Roles = roles ?? new List<string>()
                    };
                }

            }
            return resultado;
        }
    }
}
