using api.DTOs.ConfiguracaoSite;
using api.Models;
using api.Responses;
using Data;
using Microsoft.EntityFrameworkCore;

namespace api.Services
{
    public class ConfiguracaoSiteService
    {
        private readonly AppDbContext _contexto;

        public ConfiguracaoSiteService(AppDbContext contexto)
        {
            _contexto = contexto;
        }

        public async Task<ServiceResponse<LinksWhatsAppDTO>> GetLinksWhatsAppAsync()
        {
            var resposta = new ServiceResponse<LinksWhatsAppDTO>();

            try
            {
                var chaves = new[]
                {
                    ConfiguracaoSiteChaves.MorganaWhatsappGroupUrl,
                    ConfiguracaoSiteChaves.PluralWhatsappGroupUrl,
                };

                var configuracoes = await _contexto.ConfiguracoesSite
                    .AsNoTracking()
                    .Where(c => chaves.Contains(c.Chave))
                    .ToDictionaryAsync(c => c.Chave, c => c.Valor);

                resposta.AdicionaObjeto(new LinksWhatsAppDTO
                {
                    MorganaWhatsappUrl = configuracoes.GetValueOrDefault(ConfiguracaoSiteChaves.MorganaWhatsappGroupUrl, string.Empty),
                    PluralWhatsappUrl = configuracoes.GetValueOrDefault(ConfiguracaoSiteChaves.PluralWhatsappGroupUrl, string.Empty),
                });

                return resposta;
            }
            catch (Exception ex)
            {
                resposta.SetFalha($"Erro ao buscar os links do WhatsApp: {ex.Message}");
                return resposta;
            }
        }

        public async Task<ServiceResponse<LinksWhatsAppDTO>> AtualizarLinksWhatsAppAsync(LinksWhatsAppDTO dto, string? atualizadoPor)
        {
            var resposta = new ServiceResponse<LinksWhatsAppDTO>();

            try
            {
                await UpsertAsync(ConfiguracaoSiteChaves.MorganaWhatsappGroupUrl, dto.MorganaWhatsappUrl.Trim(), atualizadoPor);
                await UpsertAsync(ConfiguracaoSiteChaves.PluralWhatsappGroupUrl, dto.PluralWhatsappUrl.Trim(), atualizadoPor);

                await _contexto.SaveChangesAsync();

                resposta.AdicionaObjeto(new LinksWhatsAppDTO
                {
                    MorganaWhatsappUrl = dto.MorganaWhatsappUrl.Trim(),
                    PluralWhatsappUrl = dto.PluralWhatsappUrl.Trim(),
                });
                resposta.AdicionaMensagem("Links do WhatsApp atualizados com sucesso.");
                return resposta;
            }
            catch (Exception ex)
            {
                resposta.SetFalha($"Erro ao atualizar os links do WhatsApp: {ex.Message}");
                return resposta;
            }
        }

        public async Task<ServiceResponse<LinkCheckoutDTO>> GetLinkCheckoutAsync()
        {
            var resposta = new ServiceResponse<LinkCheckoutDTO>();

            try
            {
                var chaves = new[]
                {
                    ConfiguracaoSiteChaves.PluralCheckoutUrlMensal,
                    ConfiguracaoSiteChaves.PluralCheckoutUrlAnual,
                };

                var configuracoes = await _contexto.ConfiguracoesSite
                    .AsNoTracking()
                    .Where(c => chaves.Contains(c.Chave))
                    .ToDictionaryAsync(c => c.Chave, c => c.Valor);

                resposta.AdicionaObjeto(new LinkCheckoutDTO
                {
                    PluralCheckoutUrlMensal = configuracoes.GetValueOrDefault(ConfiguracaoSiteChaves.PluralCheckoutUrlMensal, string.Empty),
                    PluralCheckoutUrlAnual = configuracoes.GetValueOrDefault(ConfiguracaoSiteChaves.PluralCheckoutUrlAnual, string.Empty),
                });

                return resposta;
            }
            catch (Exception ex)
            {
                resposta.SetFalha($"Erro ao buscar os links de checkout: {ex.Message}");
                return resposta;
            }
        }

        public async Task<ServiceResponse<LinkCheckoutDTO>> AtualizarLinkCheckoutAsync(LinkCheckoutDTO dto, string? atualizadoPor)
        {
            var resposta = new ServiceResponse<LinkCheckoutDTO>();

            try
            {
                await UpsertAsync(ConfiguracaoSiteChaves.PluralCheckoutUrlMensal, dto.PluralCheckoutUrlMensal.Trim(), atualizadoPor);
                await UpsertAsync(ConfiguracaoSiteChaves.PluralCheckoutUrlAnual, dto.PluralCheckoutUrlAnual.Trim(), atualizadoPor);

                await _contexto.SaveChangesAsync();

                resposta.AdicionaObjeto(new LinkCheckoutDTO
                {
                    PluralCheckoutUrlMensal = dto.PluralCheckoutUrlMensal.Trim(),
                    PluralCheckoutUrlAnual = dto.PluralCheckoutUrlAnual.Trim(),
                });
                resposta.AdicionaMensagem("Links de checkout atualizados com sucesso.");
                return resposta;
            }
            catch (Exception ex)
            {
                resposta.SetFalha($"Erro ao atualizar os links de checkout: {ex.Message}");
                return resposta;
            }
        }

        private async Task UpsertAsync(string chave, string valor, string? atualizadoPor)
        {
            var configuracao = await _contexto.ConfiguracoesSite.FirstOrDefaultAsync(c => c.Chave == chave);

            if (configuracao == null)
            {
                _contexto.ConfiguracoesSite.Add(new ConfiguracaoSite
                {
                    Chave = chave,
                    Valor = valor,
                    AtualizadoEm = DateTime.UtcNow,
                    AtualizadoPor = atualizadoPor,
                });
            }
            else
            {
                configuracao.Valor = valor;
                configuracao.AtualizadoEm = DateTime.UtcNow;
                configuracao.AtualizadoPor = atualizadoPor;
            }
        }
    }
}
