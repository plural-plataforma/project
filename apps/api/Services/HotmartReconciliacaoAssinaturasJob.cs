using api.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace api.Services
{
    // Roda 1x por dia: busca as assinaturas ativas/atrasadas na API da Hotmart e corrige
    // qualquer Usuario.ExpirationDate que tenha ficado divergente por webhook perdido/atrasado.
    // Rede de segurança — o webhook (HotmartWebhookService) continua sendo o caminho principal.
    public class HotmartReconciliacaoAssinaturasJob : BackgroundService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<HotmartReconciliacaoAssinaturasJob> _logger;
        private readonly string _productId;

        private static readonly TimeSpan Intervalo = TimeSpan.FromHours(24);
        private static readonly string[] StatusAcompanhados = { "ACTIVE", "DELAYED", "OVERDUE", "STARTED" };

        public HotmartReconciliacaoAssinaturasJob(
            IServiceScopeFactory scopeFactory,
            ILogger<HotmartReconciliacaoAssinaturasJob> logger,
            IConfiguration configuration)
        {
            _scopeFactory = scopeFactory;
            _logger = logger;
            _productId = configuration["Hotmart:ProductId"] ?? "6420317";
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            // Pequeno atraso inicial pra não competir com o startup da aplicação.
            try { await Task.Delay(TimeSpan.FromMinutes(2), stoppingToken); }
            catch (TaskCanceledException) { return; }

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await ReconciliarAsync(stoppingToken);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Falha na reconciliação diária de assinaturas Hotmart");
                }

                try { await Task.Delay(Intervalo, stoppingToken); }
                catch (TaskCanceledException) { break; }
            }
        }

        // Converte o campo date_next_charge da API de assinaturas pra DateTime UTC.
        // A doc oficial diz "milissegundos", mas o exemplo de resposta mostra 10 dígitos
        // (equivalente a segundos). Heurística: só valores >= 10^12 podem ser milissegundos
        // de uma data razoável (ano > 2001), então tratamos abaixo disso como segundos.
        private static DateTime? ConverterDataApi(long? valorCru)
        {
            if (!valorCru.HasValue || valorCru.Value <= 0) return null;
            var ms = valorCru.Value < 1_000_000_000_000L ? valorCru.Value * 1000 : valorCru.Value;
            return DateTimeOffset.FromUnixTimeMilliseconds(ms).UtcDateTime;
        }

        private async Task ReconciliarAsync(CancellationToken ct)
        {
            using var scope = _scopeFactory.CreateScope();
            var hotmartService = scope.ServiceProvider.GetRequiredService<HotmartService>();
            var usuarioManager = scope.ServiceProvider.GetRequiredService<UserManager<Usuario>>();

            var assinaturas = await hotmartService.GetAssinaturasAsync(_productId, StatusAcompanhados);
            var corrigidos = 0;
            var verificados = 0;

            foreach (var assinatura in assinaturas)
            {
                if (string.IsNullOrWhiteSpace(assinatura.SubscriberCode)) continue;

                var usuario = await usuarioManager.Users
                    .FirstOrDefaultAsync(u => u.HotmartSubscriberCode == assinatura.SubscriberCode, ct);
                usuario ??= !string.IsNullOrWhiteSpace(assinatura.SubscriberEmail)
                    ? await usuarioManager.FindByEmailAsync(assinatura.SubscriberEmail.Trim())
                    : null;

                if (usuario == null) continue;
                verificados++;

                var expiracaoApi = ConverterDataApi(assinatura.DateNextChargeRaw);
                if (expiracaoApi == null) continue;

                var divergiu = usuario.ExpirationDate == null
                    || Math.Abs((usuario.ExpirationDate.Value - expiracaoApi.Value).TotalHours) > 24;

                if (!divergiu) continue;

                _logger.LogWarning(
                    "Reconciliação Hotmart: divergência corrigida | Email: {Email} | ExpirationDate antes: {Antes} | Hotmart: {Api}",
                    usuario.Email, usuario.ExpirationDate, expiracaoApi);

                usuario.ExpirationDate = expiracaoApi;
                if (string.IsNullOrWhiteSpace(usuario.HotmartSubscriberCode))
                    usuario.HotmartSubscriberCode = assinatura.SubscriberCode;

                await usuarioManager.UpdateAsync(usuario);
                corrigidos++;
            }

            _logger.LogInformation(
                "Reconciliação Hotmart concluída | Assinaturas retornadas: {Total} | Usuários verificados: {Verificados} | Corrigidos: {Corrigidos}",
                assinaturas.Count, verificados, corrigidos);
        }
    }
}
