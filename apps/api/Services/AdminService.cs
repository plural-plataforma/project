using api.DTOs.Admin;
using api.DTOs.Aluno;
using api.Models;
using api.Responses;
using Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

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

        public async Task<ServiceResponse<AtualizarStatusUsuarioDTO>> AtualizarStatusUsuario(int idUsuario, string acao)
        {

            var resposta = new ServiceResponse<AtualizarStatusUsuarioDTO>();

            var usuario = await _usuario.Users.FirstOrDefaultAsync(u => u.ProfessorId == idUsuario);
            if (usuario == null)
            {
                resposta.SetFalha("Usuário não encontrado.");
                return resposta;
            }

            switch(acao)
            {
                case "A":
                    await _usuario.SetLockoutEnabledAsync(usuario, true);
                    await _usuario.SetLockoutEndDateAsync(usuario, null);
                    break;
                case "I":
                    await _usuario.SetLockoutEnabledAsync(usuario, true);
                    await _usuario.SetLockoutEndDateAsync(usuario,DateTimeOffset.MaxValue);
                    break;
            }

            resposta.Sucesso = true;
            resposta.AdicionaMensagem("Status do usuário atualizado com sucesso");
            return resposta;

        }
    }
}
