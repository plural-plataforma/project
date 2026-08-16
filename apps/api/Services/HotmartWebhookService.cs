using api.DTOs.Autenticacao;
using api.DTOs.Webhooks;
using api.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace api.Services
{
    public class HotmartWebhookService
    {
        private readonly AutenticacaoService _autenticacaoService;
        private readonly ILogger<HotmartWebhookService> _logger;
        private readonly HashSet<string> _expectedProductIds;
        private readonly UserManager<Usuario> _usuario;

        private static readonly string[] EventosLiberamAcesso = { "PURCHASE_APPROVED" };
        private static readonly string[] EventosCortamAcesso = { "PURCHASE_REFUNDED", "PURCHASE_CHARGEBACK" };

        // Hotmart trata a oferta avulsa (6420317) e a de assinatura (7820436) como
        // produtos diferentes, cada um com seu próprio ID — mesmo sendo a mesma plataforma.
        public HotmartWebhookService(
            AutenticacaoService autenticacaoService,
            ILogger<HotmartWebhookService> logger,
            IConfiguration configuration,
            UserManager<Usuario> usuario)
        {
            _autenticacaoService = autenticacaoService;
            _logger = logger;

            // Lê direto da env var PRODUCT_ID (não de "Hotmart:ProductId"): esse serviço é
            // scoped (recriado a cada request), e appsettings.json com reloadOnChange pode
            // reverter "Hotmart:ProductId" pro placeholder "{PRODUCT_ID}" fora de um restart —
            // mesmo problema que quebrava a validação do hottok. A env var só traz o produto
            // avulso, então sempre incluímos o de assinatura junto.
            var productIdsConfig = configuration["PRODUCT_ID"] ?? "6420317";
            _expectedProductIds = productIdsConfig
                .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .ToHashSet();
            _expectedProductIds.Add("7820436");
            _usuario = usuario;
        }

        private static DateTime? ConverterEpocaMs(long? epocaMs)
        {
            if (!epocaMs.HasValue || epocaMs.Value <= 0) return null;
            return DateTimeOffset.FromUnixTimeMilliseconds(epocaMs.Value).UtcDateTime;
        }

        private async Task<Usuario?> EncontrarUsuarioAsync(string? subscriberCode, string? email)
        {
            var usuario = !string.IsNullOrWhiteSpace(subscriberCode)
                ? await _usuario.Users.FirstOrDefaultAsync(u => u.HotmartSubscriberCode == subscriberCode)
                : null;
            usuario ??= !string.IsNullOrWhiteSpace(email) ? await _usuario.FindByEmailAsync(email.Trim()) : null;
            return usuario;
        }

        public async Task<bool> ProcessPurchaseWebhookAsync(HotmartWebhookV2Dto payload)
        {
            _logger.LogDebug("Processando webhook - Evento recebido: '{Event}' | Tem Data? {HasData}",
                payload?.Event, payload?.Data != null);

            if (payload == null || string.IsNullOrWhiteSpace(payload.Event))
            {
                _logger.LogWarning("Webhook ignorado: payload ou event nulo/vazio");
                return true;
            }

            if (payload.Data == null)
            {
                _logger.LogWarning("Campo 'data' ausente no payload do webhook");
                return true;
            }

            var data = payload.Data;

            // Filtro por produto
            if (data.Product?.Id == null || !_expectedProductIds.Contains(data.Product.Id.ToString()!))
            {
                _logger.LogInformation("Compra ignorada: produto ID {ProductId} não está entre os esperados {Expected}",
                    data.Product?.Id, string.Join(",", _expectedProductIds));
                return true;
            }

            var buyer = data.Buyer;
            var subscriberCode = data.Subscription?.Subscriber?.Code;

            if (EventosCortamAcesso.Contains(payload.Event))
            {
                return await CortarAcessoAsync(payload.Event, buyer?.Email, subscriberCode);
            }

            if (!EventosLiberamAcesso.Contains(payload.Event))
            {
                _logger.LogInformation("Webhook ignorado: evento '{Event}' não está na lista tratada", payload.Event);
                return true;
            }

            if (buyer == null || string.IsNullOrWhiteSpace(buyer.Email))
            {
                _logger.LogWarning("Buyer ou email ausente no webhook (evento: {Event})", payload.Event);
                return true;
            }

            var emailTrim = buyer.Email.Trim();

            // data_next_charge = data da próxima cobrança = vencimento real do acesso já pago,
            // só vem preenchido pra assinatura recorrente (produto 7820436, plano mensal).
            // O produto avulso (6420317, plano anual R$588 — pode vir parcelado até 12x, mas não
            // é assinatura Hotmart) nunca manda date_next_charge: dá 1 ano de acesso a partir da
            // aprovação. warranty_date é só a janela de garantia/reembolso (7 dias) — nunca reflete
            // quanto tempo de acesso foi pago, e não deve virar data de expiração.
            var expiracao = ConverterEpocaMs(data.Purchase?.DateNextCharge)
                ?? ConverterEpocaMs(data.Purchase?.ApprovedDate)?.AddYears(1);

            var existingUser = await EncontrarUsuarioAsync(subscriberCode, emailTrim);

            if (existingUser != null)
            {
                return await RenovarAcessoAsync(existingUser, payload.Event, expiracao, subscriberCode);
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
                ExpirationDate = expiracao,
            };

            try
            {
                var result = await _autenticacaoService.Registro(registroDto, origem: "hotmart");

                if (result.Succeeded)
                {
                    if (!string.IsNullOrWhiteSpace(subscriberCode))
                    {
                        var criado = await _usuario.FindByEmailAsync(emailTrim);
                        if (criado != null)
                        {
                            criado.HotmartSubscriberCode = subscriberCode;
                            await _usuario.UpdateAsync(criado);
                        }
                    }

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

        public async Task<bool> ProcessCancellationWebhookAsync(HotmartSubscriptionCancellationWebhookDto payload)
        {
            if (payload?.Data == null)
            {
                _logger.LogWarning("Webhook de cancelamento ignorado: payload ou data nulo");
                return true;
            }

            var data = payload.Data;

            if (data.Product?.Id == null || !_expectedProductIds.Contains(data.Product.Id.ToString()!))
            {
                _logger.LogInformation("Cancelamento ignorado: produto ID {ProductId} não está entre os esperados {Expected}",
                    data.Product?.Id, string.Join(",", _expectedProductIds));
                return true;
            }

            var subscriberCode = data.Subscriber?.Code;
            var email = data.Subscriber?.Email;

            var usuario = await EncontrarUsuarioAsync(subscriberCode, email);
            if (usuario == null)
            {
                _logger.LogInformation("Cancelamento Hotmart ignorado: usuário não encontrado (código {Codigo}, e-mail {Email})",
                    subscriberCode, email);
                return true;
            }

            // Acesso continua válido até o fim do período já pago — Hotmart não cobra mais depois disso.
            usuario.ExpirationDate = ConverterEpocaMs(data.DateNextCharge) ?? usuario.ExpirationDate;

            var result = await _usuario.UpdateAsync(usuario);
            if (!result.Succeeded)
            {
                _logger.LogError("Falha ao aplicar cancelamento Hotmart para {Email}: {Errors}",
                    usuario.Email, string.Join(" | ", result.Errors.Select(e => e.Description)));
                return false;
            }

            _logger.LogInformation("Assinatura cancelada via Hotmart | Email: {Email} | Acesso válido até: {Exp}",
                usuario.Email, usuario.ExpirationDate?.ToString("yyyy-MM-dd") ?? "sem expiração");
            return true;
        }

        public async Task<bool> ProcessChargeDateUpdateWebhookAsync(HotmartChargeDateUpdateWebhookDto payload)
        {
            var data = payload?.Data;
            var subscription = data?.Subscription;

            if (data == null || subscription == null)
            {
                _logger.LogWarning("Webhook de troca de data de cobrança ignorado: payload ou data nulo");
                return true;
            }

            if (subscription.Product?.Id == null || !_expectedProductIds.Contains(subscription.Product.Id.ToString()!))
            {
                _logger.LogInformation("Troca de data de cobrança ignorada: produto ID {ProductId} não está entre os esperados {Expected}",
                    subscription.Product?.Id, string.Join(",", _expectedProductIds));
                return true;
            }

            var subscriberCode = data.Subscriber?.Code;
            var email = data.Subscriber?.Email;

            var usuario = await EncontrarUsuarioAsync(subscriberCode, email);
            if (usuario == null)
            {
                _logger.LogInformation("Troca de data de cobrança ignorada: usuário não encontrado (código {Codigo}, e-mail {Email})",
                    subscriberCode, email);
                return true;
            }

            // date_next_charge aqui já vem como DateTime (string ISO no payload), diferente dos outros eventos.
            if (subscription.DateNextCharge.HasValue)
            {
                usuario.ExpirationDate = subscription.DateNextCharge.Value;
                await _usuario.UpdateAsync(usuario);

                _logger.LogInformation(
                    "Data de cobrança alterada via Hotmart | Email: {Email} | Dia antigo: {Antigo} | Dia novo: {Novo} | Nova expiração: {Exp}",
                    usuario.Email, subscription.OldChargeDay, subscription.NewChargeDay, usuario.ExpirationDate);
            }

            return true;
        }

        private async Task<bool> RenovarAcessoAsync(Usuario usuario, string evento, DateTime? expiracao, string? subscriberCode)
        {
            usuario.ExpirationDate = expiracao ?? usuario.ExpirationDate;
            usuario.IsActive = true;
            if (!string.IsNullOrWhiteSpace(subscriberCode) && usuario.HotmartSubscriberCode != subscriberCode)
            {
                usuario.HotmartSubscriberCode = subscriberCode;
            }

            var result = await _usuario.UpdateAsync(usuario);
            if (!result.Succeeded)
            {
                _logger.LogError("Falha ao renovar acesso via webhook {Event} para {Email}: {Errors}",
                    evento, usuario.Email, string.Join(" | ", result.Errors.Select(e => e.Description)));
                return false;
            }

            _logger.LogInformation("Acesso renovado via Hotmart | Evento: {Event} | Email: {Email} | Nova expiração: {Exp}",
                evento, usuario.Email, usuario.ExpirationDate?.ToString("yyyy-MM-dd") ?? "sem expiração");
            return true;
        }

        private async Task<bool> CortarAcessoAsync(string evento, string? email, string? subscriberCode)
        {
            var usuario = await EncontrarUsuarioAsync(subscriberCode, email);
            if (usuario == null)
            {
                _logger.LogInformation("Evento {Event} ignorado: usuário não encontrado (código {Codigo}, e-mail {Email})",
                    evento, subscriberCode, email);
                return true;
            }

            usuario.IsActive = false;
            var result = await _usuario.UpdateAsync(usuario);
            if (!result.Succeeded)
            {
                _logger.LogError("Falha ao cortar acesso via webhook {Event} para {Email}: {Errors}",
                    evento, usuario.Email, string.Join(" | ", result.Errors.Select(e => e.Description)));
                return false;
            }

            _logger.LogWarning("Acesso cortado via Hotmart | Evento: {Event} | Email: {Email}", evento, usuario.Email);
            return true;
        }
    }
}
