using api.DTOs.Admin;
using api.Models;
using api.Responses;
using Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Sprache;

namespace api.Services
{
    public class AdminService
    {
        private readonly AppDbContext _contexto;
        private readonly UserManager<Usuario> _usuario;

        public AdminService(AppDbContext contexto, UserManager<Usuario> usuario)
        {
            _contexto = contexto;
            _usuario = usuario;
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
