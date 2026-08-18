using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;
using api.DTOs.Artigo;
using api.Models;
using api.Responses;
using Data;
using Microsoft.EntityFrameworkCore;

namespace api.Services
{
    public class ArtigoService
    {
        private readonly AppDbContext _contexto;

        public ArtigoService(AppDbContext contexto)
        {
            _contexto = contexto;
        }

        public async Task<ServiceResponse<List<ArtigoListagemDTO>>> GetAll(
            string? busca = null, string? categoria = null, bool? publicado = null)
        {
            var resposta = new ServiceResponse<List<ArtigoListagemDTO>>();

            try
            {
                var query = _contexto.Artigos.Where(a => a.Ativo).AsQueryable();

                if (!string.IsNullOrWhiteSpace(busca))
                    query = query.Where(a => a.Titulo.Contains(busca));

                if (!string.IsNullOrWhiteSpace(categoria))
                    query = query.Where(a => a.Categoria == categoria);

                if (publicado.HasValue)
                    query = query.Where(a => a.Publicado == publicado.Value);

                var itens = await query
                    .OrderByDescending(a => a.UpdatedAt)
                    .Select(a => new ArtigoListagemDTO
                    {
                        Id = a.Id,
                        Titulo = a.Titulo,
                        Slug = a.Slug,
                        Categoria = a.Categoria,
                        Autor = a.Autor,
                        ImagemCapaUrl = a.ImagemCapaUrl,
                        Publicado = a.Publicado,
                        PublicadoEm = a.PublicadoEm,
                        Ativo = a.Ativo,
                        UpdatedAt = a.UpdatedAt,
                    })
                    .ToListAsync();

                resposta.AdicionaObjeto(itens);
                resposta.Sucesso = true;
                return resposta;
            }
            catch (Exception ex)
            {
                resposta.SetFalha("Erro ao buscar artigos: " + ex.Message);
                return resposta;
            }
        }

        public async Task<ServiceResponse<ArtigoDetalheDTO>> GetPorId(int id)
        {
            var resposta = new ServiceResponse<ArtigoDetalheDTO>();

            var artigo = await _contexto.Artigos.FirstOrDefaultAsync(a => a.Id == id && a.Ativo);
            if (artigo == null)
            {
                resposta.SetFalha($"Artigo com ID {id} não encontrado.");
                return resposta;
            }

            resposta.AdicionaObjeto(ParaDetalheDTO(artigo));
            resposta.Sucesso = true;
            return resposta;
        }

        public async Task<ServiceResponse<List<ArtigoPublicoResumoDTO>>> GetPublicados(string? categoria = null)
        {
            var resposta = new ServiceResponse<List<ArtigoPublicoResumoDTO>>();

            try
            {
                var query = _contexto.Artigos.Where(a => a.Ativo && a.Publicado).AsQueryable();

                if (!string.IsNullOrWhiteSpace(categoria))
                    query = query.Where(a => a.Categoria == categoria);

                var itens = await query
                    .OrderByDescending(a => a.PublicadoEm)
                    .Select(a => new ArtigoPublicoResumoDTO
                    {
                        Slug = a.Slug,
                        Titulo = a.Titulo,
                        Resumo = a.Resumo,
                        Categoria = a.Categoria,
                        Autor = a.Autor,
                        TempoLeituraMinutos = a.TempoLeituraMinutos,
                        ImagemCapaUrl = a.ImagemCapaUrl,
                        PublicadoEm = a.PublicadoEm!.Value,
                    })
                    .ToListAsync();

                resposta.AdicionaObjeto(itens);
                resposta.Sucesso = true;
                return resposta;
            }
            catch (Exception ex)
            {
                resposta.SetFalha("Erro ao buscar artigos publicados: " + ex.Message);
                return resposta;
            }
        }

        public async Task<ServiceResponse<ArtigoPublicoDetalheDTO>> GetPublicadoPorSlug(string slug)
        {
            var resposta = new ServiceResponse<ArtigoPublicoDetalheDTO>();

            var artigo = await _contexto.Artigos
                .FirstOrDefaultAsync(a => a.Slug == slug && a.Ativo && a.Publicado);

            if (artigo == null)
            {
                resposta.SetFalha($"Artigo \"{slug}\" não encontrado.");
                return resposta;
            }

            resposta.AdicionaObjeto(new ArtigoPublicoDetalheDTO
            {
                Slug = artigo.Slug,
                Titulo = artigo.Titulo,
                Resumo = artigo.Resumo,
                Conteudo = artigo.Conteudo,
                Categoria = artigo.Categoria,
                Autor = artigo.Autor,
                TempoLeituraMinutos = artigo.TempoLeituraMinutos,
                ImagemCapaUrl = artigo.ImagemCapaUrl,
                PublicadoEm = artigo.PublicadoEm!.Value,
            });
            resposta.Sucesso = true;
            return resposta;
        }

        public async Task<ServiceResponse<ArtigoDetalheDTO>> Cadastro(ArtigoCadastroDTO dto)
        {
            var resposta = new ServiceResponse<ArtigoDetalheDTO>();

            try
            {
                var slugBase = string.IsNullOrWhiteSpace(dto.Slug) ? dto.Titulo : dto.Slug;
                var slug = await GerarSlugUnico(Slugify(slugBase));

                var agora = DateTime.UtcNow;
                var artigo = new Artigo
                {
                    Titulo = dto.Titulo.Trim(),
                    Slug = slug,
                    Resumo = dto.Resumo.Trim(),
                    Conteudo = dto.Conteudo,
                    Categoria = string.IsNullOrWhiteSpace(dto.Categoria) ? null : dto.Categoria.Trim(),
                    Autor = dto.Autor.Trim(),
                    TempoLeituraMinutos = dto.TempoLeituraMinutos,
                    ImagemCapaUrl = string.IsNullOrWhiteSpace(dto.ImagemCapaUrl) ? null : dto.ImagemCapaUrl.Trim(),
                    Publicado = dto.Publicado,
                    PublicadoEm = dto.Publicado ? agora : null,
                    Ativo = true,
                    CreatedAt = agora,
                    UpdatedAt = agora,
                };

                _contexto.Artigos.Add(artigo);
                await _contexto.SaveChangesAsync();

                resposta.AdicionaObjeto(ParaDetalheDTO(artigo));
                resposta.Sucesso = true;
                resposta.AdicionaMensagem("Artigo cadastrado com sucesso.");
                return resposta;
            }
            catch (Exception ex)
            {
                resposta.SetFalha("Erro ao cadastrar artigo: " + ex.Message);
                return resposta;
            }
        }

        public async Task<ServiceResponse<ArtigoDetalheDTO>> Atualizar(int id, ArtigoAtualizarDTO dto)
        {
            var resposta = new ServiceResponse<ArtigoDetalheDTO>();

            try
            {
                var artigo = await _contexto.Artigos.FirstOrDefaultAsync(a => a.Id == id);
                if (artigo == null)
                {
                    resposta.SetFalha($"Artigo com ID {id} não encontrado.");
                    return resposta;
                }

                if (!string.IsNullOrWhiteSpace(dto.Titulo))
                    artigo.Titulo = dto.Titulo.Trim();

                if (!string.IsNullOrWhiteSpace(dto.Slug))
                {
                    var novoSlug = Slugify(dto.Slug);
                    if (novoSlug != artigo.Slug)
                        artigo.Slug = await GerarSlugUnico(novoSlug, ignorarId: artigo.Id);
                }

                if (!string.IsNullOrWhiteSpace(dto.Resumo))
                    artigo.Resumo = dto.Resumo.Trim();

                if (dto.Conteudo != null)
                    artigo.Conteudo = dto.Conteudo;

                if (dto.Categoria != null)
                    artigo.Categoria = string.IsNullOrWhiteSpace(dto.Categoria) ? null : dto.Categoria.Trim();

                if (!string.IsNullOrWhiteSpace(dto.Autor))
                    artigo.Autor = dto.Autor.Trim();

                if (dto.TempoLeituraMinutos.HasValue)
                    artigo.TempoLeituraMinutos = dto.TempoLeituraMinutos.Value;

                if (dto.ImagemCapaUrl != null)
                    artigo.ImagemCapaUrl = string.IsNullOrWhiteSpace(dto.ImagemCapaUrl) ? null : dto.ImagemCapaUrl.Trim();

                if (dto.Ativo.HasValue)
                    artigo.Ativo = dto.Ativo.Value;

                if (dto.Publicado.HasValue && dto.Publicado.Value != artigo.Publicado)
                {
                    artigo.Publicado = dto.Publicado.Value;
                    if (artigo.Publicado && artigo.PublicadoEm == null)
                        artigo.PublicadoEm = DateTime.UtcNow;
                }

                artigo.UpdatedAt = DateTime.UtcNow;
                await _contexto.SaveChangesAsync();

                resposta.AdicionaObjeto(ParaDetalheDTO(artigo));
                resposta.Sucesso = true;
                resposta.AdicionaMensagem("Artigo atualizado com sucesso.");
                return resposta;
            }
            catch (Exception ex)
            {
                resposta.SetFalha("Erro ao atualizar artigo: " + ex.Message);
                return resposta;
            }
        }

        // Soft delete — segue o mesmo padrão de DocumentoBibliotecaService.Excluir.
        public async Task<ServiceResponse<bool>> Excluir(int id)
        {
            var resposta = new ServiceResponse<bool>();

            try
            {
                var artigo = await _contexto.Artigos.FirstOrDefaultAsync(a => a.Id == id);
                if (artigo == null)
                {
                    resposta.SetFalha($"Artigo com ID {id} não encontrado.");
                    return resposta;
                }

                artigo.Ativo = false;
                artigo.UpdatedAt = DateTime.UtcNow;
                await _contexto.SaveChangesAsync();

                resposta.AdicionaObjeto(true);
                resposta.Sucesso = true;
                resposta.AdicionaMensagem("Artigo excluído com sucesso (desativado).");
                return resposta;
            }
            catch (Exception ex)
            {
                resposta.SetFalha("Erro ao excluir artigo: " + ex.Message);
                return resposta;
            }
        }

        private async Task<string> GerarSlugUnico(string slugBase, int? ignorarId = null)
        {
            var slug = slugBase;
            var sufixo = 2;

            while (await _contexto.Artigos.AnyAsync(a => a.Slug == slug && a.Id != (ignorarId ?? 0)))
            {
                slug = $"{slugBase}-{sufixo}";
                sufixo++;
            }

            return slug;
        }

        private static string Slugify(string texto)
        {
            var normalizado = texto.Normalize(NormalizationForm.FormD);
            var semAcentos = new StringBuilder();
            foreach (var c in normalizado)
            {
                if (CharUnicodeInfo.GetUnicodeCategory(c) != UnicodeCategory.NonSpacingMark)
                    semAcentos.Append(c);
            }

            var slug = semAcentos.ToString().ToLowerInvariant();
            slug = Regex.Replace(slug, @"[^a-z0-9\s-]", "");
            slug = Regex.Replace(slug, @"\s+", "-");
            slug = Regex.Replace(slug, @"-+", "-");
            return slug.Trim('-');
        }

        private static ArtigoDetalheDTO ParaDetalheDTO(Artigo a) => new()
        {
            Id = a.Id,
            Titulo = a.Titulo,
            Slug = a.Slug,
            Resumo = a.Resumo,
            Conteudo = a.Conteudo,
            Categoria = a.Categoria,
            Autor = a.Autor,
            TempoLeituraMinutos = a.TempoLeituraMinutos,
            ImagemCapaUrl = a.ImagemCapaUrl,
            Publicado = a.Publicado,
            PublicadoEm = a.PublicadoEm,
            Ativo = a.Ativo,
            CreatedAt = a.CreatedAt,
            UpdatedAt = a.UpdatedAt,
        };
    }
}
