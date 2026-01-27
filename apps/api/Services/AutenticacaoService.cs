using api.DTOs.Autenticacao;
using api.Models;
using api.Responses;
using Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace api.Services
{
    public class AutenticacaoService
    {
        private readonly UserManager<Usuario> _usuario;
        private readonly RoleManager<IdentityRole> _tipo;
        private readonly AppDbContext _contexto;
        private readonly IConfiguration _configuracao;

        public AutenticacaoService(UserManager<Usuario> usuario, RoleManager<IdentityRole> tipo, AppDbContext contexto, IConfiguration configuracao)
        {
            _usuario = usuario;
            _tipo = tipo;
            _contexto = contexto;
            _configuracao = configuracao;
        }

        public async Task<IdentityResult> Registro(RegistroDTO registroDto)
        {
            using (var transacao = await _contexto.Database.BeginTransactionAsync())
            {
                try
                {
                    int? perfilId = null;

                    Professor professor = new Professor { NomeCompleto = registroDto.NomeCompleto };
                    _contexto.Professores.Add(professor);
                    await _contexto.SaveChangesAsync();
                    perfilId = professor.ID;

                    Usuario usuarioApp = new Usuario
                    {
                        UserName = registroDto.Email,
                        Email = registroDto.Email,
                        ProfessorId = perfilId,
                        AceitouTermos = registroDto.AceitouTermos,
                        DeveAlterarSenha = registroDto.DeveAlterarSenha
                    };

                    var result = await _usuario.CreateAsync(usuarioApp, registroDto.Senha);

                    if (!result.Succeeded)
                    {
                        await transacao.RollbackAsync();
                        return result;
                    }

                    if (!await _tipo.RoleExistsAsync("Professor"))
                    {
                        await _tipo.CreateAsync(new IdentityRole("Professor"));
                    }

                    await _usuario.AddToRoleAsync(usuarioApp, "Professor");

                    await transacao.CommitAsync();
                    return IdentityResult.Success;
                }
                catch (Exception)
                {

                    await transacao.RollbackAsync();
                    throw;
                }
            }
        }

        public async Task<ServiceResponse<object>> Login(LoginDTO loginDto)
        {
            var resposta = new ServiceResponse<object>();
            var usuario = await _usuario.FindByEmailAsync(loginDto.Email);
            if (usuario == null)
            {
                resposta.SetFalha("Email ou senha inválidos.");
                return resposta;
            }
            ;

            if (!await _usuario.CheckPasswordAsync(usuario, loginDto.Senha))
            {
                resposta.SetFalha("Email ou senha inválidos.");
                return resposta;
            }

            bool deveAlterarSenha = usuario.DeveAlterarSenha;

            if(!PermiteLogar(usuario))
            {
                resposta.SetFalha("Acesso bloqueado.");
                return resposta;
            }

            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, usuario.Id),
                new Claim(ClaimTypes.Email, usuario.Email)
            };

            var roles = await _usuario.GetRolesAsync(usuario);
            foreach (var role in roles)
            {
                claims.Add(new Claim(ClaimTypes.Role, role));
            }

            var chave = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(Environment.GetEnvironmentVariable("JWT_SECRET")));
            var credenciais = new SigningCredentials(chave, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: _configuracao["JwtSettings:Issuer"],
                audience: _configuracao["JwtSettings:Audience"],
                claims: claims,
                expires: DateTime.Now.AddHours(3),
                signingCredentials: credenciais
            );

            string tokenString = new JwtSecurityTokenHandler().WriteToken(token);
          
            var retorno = new
            {
                token = tokenString,
                precisaTrocarSenha = deveAlterarSenha
            };

            resposta.Sucesso = true;
            resposta.AdicionaObjeto(retorno);
            return resposta;
        }

        public async Task<IdentityResult> AlterarSenha(AlterarSenhaDTO alterarSenhaDTO, ClaimsPrincipal usuarioController)
        {
            var idUsuario = usuarioController.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(idUsuario))
            {
                return IdentityResult.Failed(new IdentityError
                {
                    Description = "Usuário não autenticado."
                });
            }

            var usuario = await _usuario.FindByIdAsync(idUsuario);
            if (usuario == null)
            {
                return IdentityResult.Failed(new IdentityError
                {
                    Description = "Usuário não encontrado."
                });
            }

            var resposta =
                await _usuario.ChangePasswordAsync(usuario, alterarSenhaDTO.SenhaAtual, alterarSenhaDTO.NovaSenha);

            if (!resposta.Succeeded)
            {
                return resposta;
            }

            if (usuario.DeveAlterarSenha)
            {
                usuario.DeveAlterarSenha = false;
                await _usuario.UpdateAsync(usuario);
            }

            return resposta;

        }

        public async Task<IdentityResult> AlterarEmail(AlterarEmailDTO alterarEmailDTO, ClaimsPrincipal usuarioController)
        {
            var idUsuario = usuarioController.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(idUsuario))
            {
                return IdentityResult.Failed(new IdentityError
                {
                    Description = "Usuário não autenticado."
                });
            }

            var usuario = await _usuario.FindByIdAsync(idUsuario);
            if (usuario == null)
            {
                return IdentityResult.Failed(new IdentityError
                {
                    Description = "Usuário não encontrado."
                });
            }

            if (!string.IsNullOrEmpty(alterarEmailDTO.SenhaAtual))
            {
                var senhaCorreta = await _usuario.CheckPasswordAsync(usuario, alterarEmailDTO.SenhaAtual);
                if (!senhaCorreta)
                {
                    return IdentityResult.Failed(new IdentityError
                    {
                        Description = "Senha incorreta."
                    });
                }
            }

            usuario.Email = alterarEmailDTO.NovoEmail;
            usuario.UserName = alterarEmailDTO.NovoEmail;

            var resposta = await _usuario.UpdateAsync(usuario);

            return resposta;

        }

        private bool PermiteLogar (Usuario usuario)
        {
            if (!usuario.LockoutEnabled)
                return true;

            if (usuario.LockoutEnd == null)
                return true;

            if (usuario.LockoutEnd <= DateTimeOffset.UtcNow)
                return true;

            return false;
        }
    }
}