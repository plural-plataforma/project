using api.DTOs.Admin;
using api.DTOs.Aluno;
using api.Models;
using api.Responses;
using Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Sprache;
using System.Data;

namespace api.Services
{
    public class AdminService
    {
        private readonly AppDbContext _contexto;
        private readonly UserManager<Usuario> _usuario;
        private readonly RoleManager<IdentityRole> _roles;

        public AdminService(AppDbContext contexto, UserManager<Usuario> usuario, RoleManager<IdentityRole> roles)
        {
            _contexto = contexto;
            _usuario = usuario;
            _roles = roles;
        }

        public async Task<ServiceResponse<AtualizarStatusUsuarioDTO>> AtualizarStatusUsuario(AtualizarStatusUsuarioDTO dto)
        {

            var resposta = new ServiceResponse<AtualizarStatusUsuarioDTO>();
            var usuario = await _usuario.Users.FirstOrDefaultAsync(u => u.ProfessorId == dto.IdUsuario);
            var professor = await _contexto.Professores.FirstOrDefaultAsync(p => p.ID == dto.IdUsuario);

            if (usuario == null || professor == null)
            {
                resposta.SetFalha("Usuário ou professor não encontrado.");
                return resposta;
            }

            var emailAnterior = usuario.Email;
            var lockoutEndAnterior = usuario.LockoutEnd;
            var lockoutEnabledAnterior = usuario.LockoutEnabled;
            var nomeAnterior = professor.NomeCompleto;
            var telefoneAnterior = professor.Telefone;


            if (dto.Acao != null)
            {
                AtivaInativaUsuario(usuario, dto.Acao);
            }

            if (dto.Email != null)
            {
                usuario.Email = dto.Email;
            }

            if (dto.Nome != null)
            {
                professor.NomeCompleto = dto.Nome;
            }

            if (dto.Telefone != null)
            {
                professor.Telefone = dto.Telefone;
            }

            if (dto.IsEmbaixadora != null)
            {
                usuario.IsEmbaixadora = dto.IsEmbaixadora;
            }

            var identityResult = await _usuario.UpdateAsync(usuario);
            if (!identityResult.Succeeded)
            {
                resposta.SetFalha(
                    "Erro ao atualizar usuário: " +
                    string.Join("; ", identityResult.Errors.Select(e => e.Description))
                );
                return resposta;
            }

            try
            {
                await _contexto.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                usuario.Email = emailAnterior;
                usuario.LockoutEnd = lockoutEndAnterior;
                usuario.LockoutEnabled = lockoutEnabledAnterior;

                await _usuario.UpdateAsync(usuario);

                professor.NomeCompleto = nomeAnterior;
                professor.Telefone = telefoneAnterior;

                await _contexto.SaveChangesAsync();

                resposta.SetFalha("Erro ao atualizar dados do professor: " + ex.Message);
                return resposta;
            }

            var resultadoAtualizacao = await _usuario.UpdateAsync(usuario);

            resposta.Sucesso = true;
            resposta.AdicionaMensagem("Usuário atualizado com sucesso.");
            return resposta;

        }

        public async Task<ServiceResponse<string>> BuscarPermissoesUsuario(int idUsuario)
        {
            var resposta = new ServiceResponse<string>();
            var usuario = await _usuario.Users.FirstOrDefaultAsync(u => u.ProfessorId == idUsuario);

            if(usuario == null)
            {
                resposta.SetFalha("Usuário não encontrado.");
                return resposta;
            }

            var roles = await _usuario.GetRolesAsync(usuario);

            resposta.Sucesso = true;
            resposta.AdicionaMensagem("Permissões encontradas com sucesso.");
            resposta.AdicionaObjetos(roles);
            return resposta;
        }

        public async Task<ServiceResponse<string>> AlterarPermissoesUsuario(AlterarPermissoesUsuarioDTO dto)
        {

            var resposta = new ServiceResponse<string>();
            var usuario = await _usuario.Users.FirstOrDefaultAsync(u => u.ProfessorId == dto.IdUsuario);

            if (usuario == null)
            {
                resposta.SetFalha("Usuário não encontrado.");
                return resposta;
            }


            if(dto.AdicionarPermissoes == null && dto.RemoverPermissoes == null)
            {
                resposta.SetFalha("Nenhuma permissão para adicionar ou remover.");
                return resposta;
            }

            using (var transaction = await _contexto.Database.BeginTransactionAsync())
            {
                try
                {
                    if (dto.AdicionarPermissoes != null && dto.AdicionarPermissoes.Any())
                    {
                        foreach (var role in dto.AdicionarPermissoes)
                        {
                            if (!await _roles.RoleExistsAsync(role))
                            {
                                resposta.SetFalha($"Permissão '{role}' não existe.");
                                return resposta;
                            }
                            var resultadoAdicionar = await _usuario.AddToRolesAsync(usuario, dto.AdicionarPermissoes);
                            if (!resultadoAdicionar.Succeeded)
                            {
                                resposta.SetFalha("Falha ao adicionar permissões");

                                foreach (var erros in resultadoAdicionar.Errors)
                                {
                                    resposta.AdicionaObjeto(erros.Description);
                                }
                                return resposta;
                            }
                        }
                    }

                    if (dto.RemoverPermissoes != null && dto.RemoverPermissoes.Any())
                    {
                        foreach (var role in dto.RemoverPermissoes)
                        {
                            if (!await _roles.RoleExistsAsync(role))
                            {
                                resposta.SetFalha($"Permissão '{role}' não existe.");
                                return resposta;
                            }

                            var resultadoRemover = await _usuario.RemoveFromRolesAsync(usuario, dto.RemoverPermissoes);
                            if (!resultadoRemover.Succeeded)
                            {
                                resposta.SetFalha("Falha ao remover permissões");
                                foreach (var erros in resultadoRemover.Errors)
                                {
                                    resposta.AdicionaObjeto(erros.Description);
                                }
                                return resposta;
                            }
                        }
                    }
                    await transaction.CommitAsync();
                }
                catch (Exception e)
                {
                    await transaction.RollbackAsync();
                    resposta.SetFalha("Ocorreu um erro ao atualizar as permissões.");
                    resposta.AdicionaMensagem(e.Message);
                    return resposta;
                }
            }

            resposta.Sucesso = true;
            resposta.AdicionaMensagem("Permissões atualizadas com sucesso.");
            return resposta;
        }

        public async Task<ServiceResponse<string>> CriarPermissao(string nomePermissao)
        {
            var resposta = new ServiceResponse<string>();


            var permissao = new IdentityRole(nomePermissao);

            var existePermissao = await _roles.RoleExistsAsync(nomePermissao);

            if (existePermissao)
            {
                resposta.SetFalha("A permissão já existe.");
                return resposta;
            }

            var resultado = await _roles.CreateAsync(permissao);

            if(!resultado.Succeeded)
            {
                resposta.SetFalha("Falha ao criar a permissão");
                return resposta;
            }

            resposta.Sucesso = true;
            resposta.AdicionaMensagem("Permissão criada com sucesso");
            return resposta;
        }


        private static void AtivaInativaUsuario (IdentityUser usuario, string acao)
        {
            switch (acao)
            {
                case "A":
                    usuario.LockoutEnabled = true;
                    usuario.LockoutEnd = null;
                    break;
                case "I":
                    usuario.LockoutEnabled = true;
                    usuario.LockoutEnd = DateTimeOffset.MaxValue;
                    break;
            }
        }
    }
}
