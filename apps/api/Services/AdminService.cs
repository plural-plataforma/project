using api.DTOs.Admin;
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
        private readonly RoleManager<IdentityRole> _roleManager;

        public AdminService(AppDbContext contexto, UserManager<Usuario> usuario, RoleManager<IdentityRole> roleManager)
        {
            _contexto = contexto;
            _usuario = usuario;
            _roleManager = roleManager;
        }

        public async Task<ServiceResponse<object>> AtualizarUsuarioAsync(AtualizarStatusUsuarioDTO dto)
        {
            var resposta = new ServiceResponse<object>();

            // Busca Professor e Usuario associados
            var professor = await _contexto.Professores
                .FirstOrDefaultAsync(p => p.ID == dto.IdUsuario);

            if (professor == null)
            {
                resposta.SetFalha("Professor não encontrado.");
                return resposta;
            }

            var usuario = await _usuario.Users
                .FirstOrDefaultAsync(u => u.ProfessorId == dto.IdUsuario);

            if (usuario == null)
            {
                resposta.SetFalha("Usuário associado não encontrado.");
                return resposta;
            }

            // Backup para rollback em caso de erro
            var emailAnterior = usuario.Email;
            var nomeAnterior = professor.NomeCompleto;
            var telefoneAnterior = professor.Telefone;
            var isActiveAnterior = usuario.IsActive;
            var expirationAnterior = usuario.ExpirationDate;
            var isEmbaixadoraAnterior = usuario.IsEmbaixadora;

            try
            {
                // 1. Atualizações simples (opcionais)
                if (dto.Email != null)
                {
                    var emailExiste = await _usuario.FindByEmailAsync(dto.Email);
                    if (emailExiste != null && emailExiste.Id != usuario.Id)
                    {
                        resposta.SetFalha("E-mail já em uso por outro usuário.");
                        return resposta;
                    }
                    usuario.Email = dto.Email;
                    usuario.UserName = dto.Email;
                }

                if (dto.Nome != null)
                {
                    professor.NomeCompleto = dto.Nome;
                }

                if (dto.Telefone != null)
                {
                    professor.Telefone = dto.Telefone;
                }

                if (dto.IsActive.HasValue)
                {
                    usuario.IsActive = dto.IsActive.Value;
                }

                // Acao como fallback (se IsActive não vier)
                if (dto.Acao != null)
                {
                    AtivaInativaUsuario(usuario, dto.Acao);
                }

                if (dto.ExpirationDate.HasValue || dto.ExpirationDate == null)
                {
                    usuario.ExpirationDate = dto.ExpirationDate; // null = vitalício
                }

                if (dto.IsEmbaixadora.HasValue)
                {
                    usuario.IsEmbaixadora = dto.IsEmbaixadora.Value;

                    // Sincroniza com role "Embaixadora"
                    if (dto.IsEmbaixadora.Value)
                    {
                        if (!await _roleManager.RoleExistsAsync("Embaixadora"))
                        {
                            await _roleManager.CreateAsync(new IdentityRole("Embaixadora"));
                        }
                        await _usuario.AddToRoleAsync(usuario, "Embaixadora");
                        // Embaixadoras são vitalícias por padrão
                        usuario.ExpirationDate = null;
                    }
                    else
                    {
                        await _usuario.RemoveFromRoleAsync(usuario, "Embaixadora");
                    }
                }

                // 2. Gerencia roles adicionais/removidas
                if (dto.RolesAdicionar?.Length > 0)
                {
                    foreach (var role in dto.RolesAdicionar)
                    {
                        if (!await _roleManager.RoleExistsAsync(role))
                            await _roleManager.CreateAsync(new IdentityRole(role));

                        await _usuario.AddToRoleAsync(usuario, role);
                    }
                }

                if (dto.RolesRemover?.Length > 0)
                {
                    foreach (var role in dto.RolesRemover)
                    {
                        await _usuario.RemoveFromRoleAsync(usuario, role);
                    }
                }

                // 3. Salva alterações
                var identityResult = await _usuario.UpdateAsync(usuario);
                if (!identityResult.Succeeded)
                {
                    resposta.SetFalha(
                        "Erro ao atualizar usuário: " +
                        string.Join("; ", identityResult.Errors.Select(e => e.Description))
                    );
                    return resposta;
                }

                _contexto.Professores.Update(professor);
                await _contexto.SaveChangesAsync();

                resposta.Sucesso = true;
                resposta.AdicionaMensagem("Usuário atualizado com sucesso.");
                return resposta;
            }
            catch (Exception ex)
            {
                // Rollback manual
                usuario.Email = emailAnterior;
                usuario.IsActive = isActiveAnterior;
                usuario.ExpirationDate = expirationAnterior;
                usuario.IsEmbaixadora = isEmbaixadoraAnterior;
                await _usuario.UpdateAsync(usuario);

                professor.NomeCompleto = nomeAnterior;
                professor.Telefone = telefoneAnterior;
                await _contexto.SaveChangesAsync();

                resposta.SetFalha($"Erro ao atualizar usuário: {ex.Message}");
                return resposta;
            }
        }

        private static void AtivaInativaUsuario(Usuario usuario, string acao)
        {
            switch (acao.ToUpper())
            {
                case "A":
                    usuario.LockoutEnabled = true;
                    usuario.LockoutEnd = null;
                    usuario.IsActive = true;
                    break;
                case "I":
                    usuario.LockoutEnabled = true;
                    usuario.LockoutEnd = DateTimeOffset.MaxValue;
                    usuario.IsActive = false;
                    break;
            }
        }

        public async Task<ServiceResponse<PaginatedResult<UsuarioListDTO>>> ListarTodosParaAdminAsync(
            int pagina = 1,
            int tamanhoPagina = 20,
            bool? ativo = null,
            bool? isEmbaixadora = null,
            string? search = null,
            string? nivelEnsino = null)
        {
            var resposta = new ServiceResponse<PaginatedResult<UsuarioListDTO>>();

            if (pagina < 1) pagina = 1;
            if (tamanhoPagina < 1 || tamanhoPagina > 100) tamanhoPagina = 20;

            try
            {
                var query = _contexto.Professores
                    .Include(p => p.Usuario)
                    .AsNoTracking()
                    .Where(p => p.Usuario != null);

                // Filtros (mantidos iguais)
                if (ativo.HasValue)
                {
                    query = query.Where(p => p.Usuario.IsActive == ativo.Value);
                }
                if (isEmbaixadora.HasValue)
                {
                    query = query.Where(p => p.Usuario.IsEmbaixadora == isEmbaixadora.Value);
                }
                if (!string.IsNullOrWhiteSpace(nivelEnsino))
                {
                    query = query.Where(p => p.NivelEnsino != null && p.NivelEnsino.Contains(nivelEnsino.Trim()));
                }
                if (!string.IsNullOrWhiteSpace(search))
                {
                    var termo = search.Trim().ToLowerInvariant();
                    query = query.Where(p =>
                        (p.NomeCompleto != null && EF.Functions.Like(p.NomeCompleto.ToLower(), $"%{termo}%")) ||
                        (p.Usuario.Email != null && EF.Functions.Like(p.Usuario.Email.ToLower(), $"%{termo}%")) ||
                        (p.Telefone != null && p.Telefone.Contains(termo))
                    );
                }

                var total = await query.CountAsync();

                var professores = await query
                    .OrderByDescending(p => p.Usuario!.ExpirationDate ?? DateTime.MinValue)
                    .ThenBy(p => p.NomeCompleto ?? string.Empty)
                    .Skip((pagina - 1) * tamanhoPagina)
                    .Take(tamanhoPagina)
                    .ToListAsync();

                // Agora enriquecemos cada item com as roles
                var itens = new List<UsuarioListDTO>();

                foreach (var p in professores)
                {
                    var usuario = p.Usuario!;

                    var roles = await _usuario.GetRolesAsync(usuario);

                    itens.Add(new UsuarioListDTO
                    {
                        idUsuario = p.ID,
                        NomeCompleto = p.NomeCompleto,
                        Email = usuario.Email,
                        Telefone = p.Telefone,
                        Ativo = usuario.IsActive,
                        IsEmbaixadora = usuario.IsEmbaixadora,
                        PossuiLockout = usuario.LockoutEnd.HasValue && usuario.LockoutEnd > DateTimeOffset.UtcNow,
                        StatusConta = usuario.LockoutEnd.HasValue && usuario.LockoutEnd > DateTimeOffset.UtcNow
                            ? "Bloqueada"
                            : (usuario.ExpirationDate.HasValue && usuario.ExpirationDate < DateTime.UtcNow
                                ? "Expirada"
                                : "Ativa"),
                        ExpirationDate = usuario.ExpirationDate,
                        Roles = roles.ToList()  // ← aqui adicionamos as roles!
                    });
                }

                var resultado = new PaginatedResult<UsuarioListDTO>
                {
                    Itens = itens,
                    PaginaAtual = pagina,
                    TamanhoPagina = tamanhoPagina,
                    TotalItens = total,
                    TotalPaginas = (int)Math.Ceiling((double)total / tamanhoPagina)
                };

                resposta.AdicionaObjeto(resultado);
                return resposta;
            }
            catch (Exception ex)
            {
                resposta.SetFalha($"Erro ao listar professores para admin: {ex.Message}");
                return resposta;
            }
        }
        public class PaginatedResult<T>
        {
            public List<T> Itens { get; set; } = new();
            public int PaginaAtual { get; set; }
            public int TamanhoPagina { get; set; }
            public int TotalItens { get; set; }
            public int TotalPaginas { get; set; }
        }
    }
}