using api.DTOs.Autenticacao;
using api.Models;
using Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace api.Services
{
    public  class AutenticacaoService
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

        public async Task<object?> Login(LoginDTO loginDto)
        {
            var usuario = await _usuario.FindByEmailAsync(loginDto.Email);
            if (usuario == null) return null;

            if (!await _usuario.CheckPasswordAsync(usuario, loginDto.Senha))
                return null;

            bool deveAlterarSenha = usuario.DeveAlterarSenha;

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

            return new
            {
                token = tokenString,
                precisaTrocarSenha = deveAlterarSenha
            };
        }
    }
}