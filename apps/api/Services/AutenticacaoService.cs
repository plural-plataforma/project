using api.DTOs.Autenticacao;
using api.DTOs.Email;
using api.Helpers;
using api.Models;
using api.Responses;
using Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
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
        private readonly EmailService _emailService;
        private readonly OnboardingWebhookService _onboardingWebhook;
        private readonly ILogger<AutenticacaoService> _logger;

        public AutenticacaoService(UserManager<Usuario> usuario, RoleManager<IdentityRole> tipo, AppDbContext contexto, IConfiguration configuracao, EmailService emailService, OnboardingWebhookService onboardingWebhook, ILogger<AutenticacaoService> logger)
        {
            _usuario = usuario;
            _tipo = tipo;
            _contexto = contexto;
            _configuracao = configuracao;
            _emailService = emailService;
            _onboardingWebhook = onboardingWebhook;
            _logger = logger;
        }

        public async Task<IdentityResult> Registro(RegistroDTO registroDto, string origem = "site", string? criadoPor = null)
        {
            var telefone = TelefoneHelper.Normalizar(registroDto.Telefone);

            if (!string.IsNullOrWhiteSpace(registroDto.Telefone) && telefone == null)
            {
                _logger.LogWarning(
                    "Telefone informado no cadastro de {Email} não é válido e não será gravado (origem: {Origem})",
                    registroDto.Email, origem);
            }

            using (var transacao = await _contexto.Database.BeginTransactionAsync())
            {
                try
                {
                    int? perfilId = null;

                    Professor professor = new Professor
                    {
                        NomeCompleto = registroDto.NomeCompleto,
                        Telefone = telefone,
                    };
                    _contexto.Professores.Add(professor);

                    await _contexto.SaveChangesAsync();
                    perfilId = professor.ID;

                    Usuario usuarioApp = new Usuario
                    {
                        UserName = registroDto.Email,
                        Email = registroDto.Email,
                        PhoneNumber = telefone,
                        ProfessorId = perfilId,
                        AceitouTermos = registroDto.AceitouTermos,
                        DeveAlterarSenha = registroDto.DeveAlterarSenha,

                        // Novo: define a data de expiração
                        // Se não vier no DTO → null (vitalício)
                        ExpirationDate = registroDto.ExpirationDate,

                        CreatedAt = DateTime.UtcNow,
                        CreatedBy = origem == "hotmart" ? "hotmart" : criadoPor
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
                }
                catch (Exception)
                {
                    await transacao.RollbackAsync();
                    throw;
                }
            }

            // Best-effort, fora da transação de propósito: acesso já foi pago e a conta já
            // existe — falha ao enviar e-mail ou disparar o webhook de onboarding nunca reverte o cadastro.
            var email = new EmailDTO
            {
                Destino = registroDto.Email,
                Assunto = "Bem-vinda à Plural Plataforma",
                NomeDestinatario = registroDto.NomeCompleto
            };

            var resultadoEmail = await _emailService.EnviarEmail(email);
            if (!resultadoEmail.Sucesso)
            {
                _logger.LogError("Cadastro concluído mas falha ao enviar e-mail de boas-vindas para {Email}", registroDto.Email);
            }

            await _onboardingWebhook.DispararCadastroAsync(registroDto.NomeCompleto, registroDto.Email, telefone, origem);

            return IdentityResult.Success;
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

            if (!await _usuario.CheckPasswordAsync(usuario, loginDto.Senha))
            {
                resposta.SetFalha("Email ou senha inválidos.");
                return resposta;
            }

            // Validação centralizada de permissão de login
            var (podeLogar, motivo) = await PodeLogarAsync(usuario);
            if (!podeLogar)
            {
                resposta.SetFalha(motivo);
                return resposta;
            }

            bool deveAlterarSenha = usuario.DeveAlterarSenha;

            var claims = new List<Claim>
    {
            new Claim(ClaimTypes.NameIdentifier, usuario.Id),
            new Claim(ClaimTypes.Email, usuario.Email!)
    };

            var roles = await _usuario.GetRolesAsync(usuario);
            foreach (var role in roles)
            {
                claims.Add(new Claim(ClaimTypes.Role, role));
            }

            // Lê direto da env var, não de "JwtSettings:Secret": esse valor só vira real via um
            // Replace("{JWT_SECRET}", ...) rodado uma única vez no boot em Program.cs, e
            // appsettings.json com reloadOnChange pode reverter pro placeholder literal fora de
            // um restart — o "??" abaixo não pegaria isso porque "{JWT_SECRET}" não é null/vazio.
            var jwtSecret = _configuracao["JWT_SECRET"]
                ?? throw new InvalidOperationException("JWT_SECRET não configurado no ambiente");
            var chave = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret));
            var credenciais = new SigningCredentials(chave, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: _configuracao["JwtSettings:Issuer"],
                audience: _configuracao["JwtSettings:Audience"],
                claims: claims,
                expires: DateTime.Now.AddHours(3),
                signingCredentials: credenciais
            );

            string tokenString = new JwtSecurityTokenHandler().WriteToken(token);

            var professor = await _contexto.Professores
                .FirstOrDefaultAsync(p => p.ID == usuario.ProfessorId);

            var retorno = new
            {
                token = tokenString,
                precisaTrocarSenha = deveAlterarSenha,
                user = new
                {
                    nome = professor?.NomeCompleto,
                    email = usuario.Email,
                    roles = roles
                }
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

        public async Task<IdentityResult> AdiarTrocaSenha(ClaimsPrincipal usuarioController)
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

            // Zera o flag
            if (usuario.DeveAlterarSenha)
            {
                usuario.DeveAlterarSenha = false;
                var resultado = await _usuario.UpdateAsync(usuario);
                return resultado;
            }

            // Já estava falso → sucesso sem alteração
            return IdentityResult.Success;
        }

        private async Task<(bool podeLogar, string motivo)> PodeLogarAsync(Usuario usuario)
        {
            // Bloqueio temporário do Identity
            if (usuario.LockoutEnabled &&
                usuario.LockoutEnd.HasValue &&
                usuario.LockoutEnd > DateTimeOffset.UtcNow)
            {
                return (false, "Conta bloqueada temporariamente.");
            }

            // Conta inativada manualmente
            if (!usuario.IsActive)
            {
                return (false, "Sua conta foi inativada. Contate o suporte.");
            }

            // Expiração: só bloqueia se tiver data E já passou
            if (usuario.ExpirationDate.HasValue &&
                usuario.ExpirationDate.Value < DateTime.UtcNow)
            {
                return (false, "Sua conta expirou. Renove o acesso.");
            }

            // Se chegou aqui: ativo + (vitalício OU ainda dentro da validade)
            return (true, string.Empty);
        }
    }
}