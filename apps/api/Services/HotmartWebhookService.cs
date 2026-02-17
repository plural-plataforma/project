using api.DTOs.Autenticacao;
using api.DTOs.Webhooks;
using api.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;

namespace api.Services
{
    public class HotmartWebhookService
    {
        private readonly AutenticacaoService _autenticacaoService;
        private readonly ILogger<HotmartWebhookService> _logger;
        private readonly string _expectedProductId;
        private readonly UserManager<Usuario> _usuario;

        public HotmartWebhookService(
            AutenticacaoService autenticacaoService,
            ILogger<HotmartWebhookService> logger,
            IConfiguration configuration,
            UserManager<Usuario> usuario)
        {
            _autenticacaoService = autenticacaoService;
            _logger = logger;
            _expectedProductId = configuration["Hotmart:ProductId"] ?? "6420317";
            _usuario = usuario;
        }

        public async Task<bool> ProcessPurchaseWebhookAsync(HotmartWebhookV2Dto payload)
        {
            _logger.LogDebug("Processando webhook - Evento recebido: '{Event}' | Tem Data? {HasData}",
        payload?.Event, payload?.Data != null);

            var validEvents = new[] { "PURCHASE_APPROVED", "PURCHASE_COMPLETE" };

            if (payload == null || string.IsNullOrWhiteSpace(payload.Event))
            {
                _logger.LogWarning("Webhook ignorado: payload ou event nulo/vazio");
                return true;
            }

            if (!validEvents.Contains(payload.Event))
            {
                _logger.LogInformation("Webhook ignorado: evento '{Event}' não está na lista válida", payload.Event);
                return true;
            }

            if (payload == null || !validEvents.Contains(payload.Event ?? ""))
            {
                _logger.LogInformation("Webhook ignorado: evento inválido ou ausente ({Event})", payload?.Event);
                return true;
            }

            if (payload.Data == null)
            {
                _logger.LogWarning("Campo 'data' ausente no payload do webhook");
                return true;
            }

            var data = payload.Data;

            // Filtro por produto
            if (data.Product?.Id.ToString() != _expectedProductId)
            {
                _logger.LogInformation("Compra ignorada: produto ID {ProductId} ≠ esperado {Expected}",
                    data.Product?.Id, _expectedProductId);
                return true;
            }

            var buyer = data.Buyer;
            if (buyer == null || string.IsNullOrWhiteSpace(buyer.Email))
            {
                _logger.LogWarning("Buyer ou email ausente no webhook (evento: {Event})", payload.Event);
                return true;
            }

            // Idempotência
            var emailTrim = buyer.Email.Trim();
            var existingUser = await _usuario.FindByEmailAsync(emailTrim);
            if (existingUser != null)
            {
                _logger.LogInformation("Usuário já cadastrado via Hotmart: {Email} (evento: {Event})", emailTrim, payload.Event);
                return true;
            }

            var senhaAleatoria = "Plural@2025"; // ← considere gerar aleatória em produção

            var nomeCompleto = !string.IsNullOrWhiteSpace(buyer.Name)
                ? buyer.Name.Trim()
                : $"{buyer.FirstName?.Trim() ?? ""} {buyer.LastName?.Trim() ?? ""}".Trim();

            if (string.IsNullOrWhiteSpace(nomeCompleto))
                nomeCompleto = "Comprador Hotmart";

            var registroDto = new RegistroDTO
            {
                NomeCompleto = nomeCompleto,
                Email = emailTrim,
                Senha = senhaAleatoria,
                AceitouTermos = true,
                DeveAlterarSenha = true,
                ExpirationDate = data.Product?.WarrantyDate   // data de garantia do produto
            };

            try
            {
                var result = await _autenticacaoService.Registro(registroDto);

                if (result.Succeeded)
                {
                    _logger.LogInformation(
                        "Cadastro automático Hotmart concluído | Evento: {Event} | Email: {Email} | Nome: {Nome} | Expiração: {Exp}",
                        payload.Event,
                        registroDto.Email,
                        registroDto.NomeCompleto,
                        registroDto.ExpirationDate?.ToString("yyyy-MM-dd") ?? "sem expiração"
                    );

                    // TODO: Enviar e-mail com senha temporária
                    return true;
                }

                _logger.LogError("Falha ao registrar usuário via webhook {Event}: {Errors}",
                    payload.Event,
                    string.Join(" | ", result.Errors.Select(e => e.Description)));

                return false;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Exceção ao processar webhook Hotmart {Event} para email {Email}",
                    payload.Event, registroDto.Email);
                return false;
            }
        }
    }
}