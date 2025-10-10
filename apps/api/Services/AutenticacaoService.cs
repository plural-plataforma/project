using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using api.DTOs.Autenticacao;
using api.Models;
using Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.IdentityModel.Tokens;

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
            _usuario = usuario ?? throw new ArgumentNullException(nameof(usuario));
            _tipo = tipo ?? throw new ArgumentNullException(nameof(tipo));
            _contexto = contexto ?? throw new ArgumentNullException(nameof(contexto));
            _configuracao = configuracao ?? throw new ArgumentNullException(nameof(configuracao));
        }

        public async Task<IdentityResult> Registro(RegistroDTO registroDto)
        {
            if (registroDto == null) throw new ArgumentNullException(nameof(registroDto));

            int? perfilId = null;

            Professor professor = new Professor { NomeCompleto = registroDto.NomeCompleto };
            _contexto.Professores.Add(professor);
            await _contexto.SaveChangesAsync();
            perfilId = professor.ID;

            Usuario usuarioApp = new Usuario
            {
                UserName = registroDto.Email,
                Email = registroDto.Email,
                ProfessorId = perfilId
            };

            var result = await _usuario.CreateAsync(usuarioApp, registroDto.Senha);

            if (!result.Succeeded) return result;

            if (!await _tipo.RoleExistsAsync("Professor"))
            {
                await _tipo.CreateAsync(new IdentityRole("Professor"));
            }

            await _usuario.AddToRoleAsync(usuarioApp, "Professor");

            return IdentityResult.Success;
        }

        public async Task<string?> Login(LoginDTO loginDto)
        {
            if (loginDto == null || string.IsNullOrEmpty(loginDto.Email) || string.IsNullOrEmpty(loginDto.Senha))
                return null;

            var usuario = await _usuario.FindByEmailAsync(loginDto.Email);
            if (usuario == null) return null;

            if (!await _usuario.CheckPasswordAsync(usuario, loginDto.Senha))
                return null;

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

            var secret = _configuracao["JwtSettings:Secret"];
            if (string.IsNullOrEmpty(secret))
                throw new ArgumentNullException(nameof(secret), "JWT Secret is not configured.");

            var chave = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
            var credenciais = new SigningCredentials(chave, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: _configuracao["JwtSettings:Issuer"],
                audience: _configuracao["JwtSettings:Audience"],
                claims: claims,
                expires: DateTime.Now.AddMinutes(int.Parse(_configuracao["JwtSettings:ExpirationMinutes"] ?? "180")), // Use minutes from config
                signingCredentials: credenciais
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}