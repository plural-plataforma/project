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
            int tamanhoPagina = 50,
            bool? ativo = null,
            bool? isEmbaixadora = null,
            string? search = null,
            string? nivelEnsino = null)
        {
            var resposta = new ServiceResponse<PaginatedResult<UsuarioListDTO>>();

            try
            {
                var query = _contexto.Professores
                    .Include(p => p.Usuario)
                    .AsNoTracking()
                    .Where(p => p.Usuario != null);

                if (ativo.HasValue)
                    query = query.Where(p => p.Usuario!.IsActive == ativo.Value);

                if (isEmbaixadora.HasValue)
                    query = query.Where(p => p.Usuario!.IsEmbaixadora == isEmbaixadora.Value);

                if (!string.IsNullOrWhiteSpace(nivelEnsino))
                    query = query.Where(p => p.NivelEnsino != null && p.NivelEnsino.Contains(nivelEnsino.Trim()));

                if (!string.IsNullOrWhiteSpace(search))
                {
                    var termo = search.Trim().ToLower();
                    query = query.Where(p =>
                        (p.NomeCompleto != null && EF.Functions.ILike(p.NomeCompleto, $"%{termo}%")) ||
                        (p.Usuario!.Email != null && EF.Functions.ILike(p.Usuario.Email, $"%{termo}%")) ||
                        (p.Telefone != null && p.Telefone.Contains(termo))
                    );
                }

                var totalItens = await query.CountAsync();

                var paginaSegura = Math.Max(1, pagina);
                var tamanhoSeguro = Math.Clamp(tamanhoPagina, 1, 200);
                var totalPaginas = (int)Math.Ceiling(totalItens / (double)tamanhoSeguro);

                var professores = await query
                    .OrderByDescending(p => p.Usuario!.ExpirationDate ?? DateTime.MinValue)
                    .ThenBy(p => p.NomeCompleto ?? string.Empty)
                    .Skip((paginaSegura - 1) * tamanhoSeguro)
                    .Take(tamanhoSeguro)
                    .ToListAsync();

                // Resolve roles de todos os usuários da página em 2 queries (evita N+1)
                var userIds = professores
                    .Where(p => p.Usuario != null)
                    .Select(p => p.Usuario!.Id)
                    .ToList();

                var rolesPorUserId = await _contexto.UserRoles
                    .Where(ur => userIds.Contains(ur.UserId))
                    .Join(_contexto.Roles,
                          ur => ur.RoleId,
                          r => r.Id,
                          (ur, r) => new { ur.UserId, RoleName = r.Name! })
                    .GroupBy(x => x.UserId)
                    .ToDictionaryAsync(g => g.Key, g => g.Select(x => x.RoleName).ToList());

                var agora = DateTimeOffset.UtcNow;
                var itens = professores.Select(p =>
                {
                    var u = p.Usuario!;
                    rolesPorUserId.TryGetValue(u.Id, out var roles);
                    return new UsuarioListDTO
                    {
                        idUsuario = p.ID,
                        NomeCompleto = p.NomeCompleto,
                        Email = u.Email,
                        Telefone = p.Telefone,
                        Ativo = u.IsActive,
                        IsEmbaixadora = u.IsEmbaixadora,
                        PossuiLockout = u.LockoutEnd.HasValue && u.LockoutEnd > agora,
                        StatusConta = u.LockoutEnd.HasValue && u.LockoutEnd > agora
                            ? "Bloqueada"
                            : (u.ExpirationDate.HasValue && u.ExpirationDate < DateTime.UtcNow
                                ? "Expirada"
                                : "Ativa"),
                        ExpirationDate = u.ExpirationDate,
                        Roles = roles ?? new List<string>(),
                    };
                }).ToList();

                resposta.AdicionaObjeto(new PaginatedResult<UsuarioListDTO>
                {
                    Itens = itens,
                    PaginaAtual = paginaSegura,
                    TamanhoPagina = tamanhoSeguro,
                    TotalItens = totalItens,
                    TotalPaginas = totalPaginas,
                });
                resposta.Sucesso = true;
                return resposta;
            }
            catch (Exception ex)
            {
                resposta.SetFalha($"Erro ao listar todos os usuários: {ex.Message}");
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