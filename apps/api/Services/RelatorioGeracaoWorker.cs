namespace api.Services;

// Consome a fila de geração de Relatório Pedagógico e roda a chamada de IA (lenta, ~14 seções
// numa chamada só — ver RelatorioService.ProcessarGeracaoAsync) fora do ciclo de requisição
// HTTP. Mesmo padrão de scope-por-item de HotmartReconciliacaoAssinaturasJob.
public class RelatorioGeracaoWorker : BackgroundService
{
    private readonly IRelatorioGeracaoQueue _queue;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<RelatorioGeracaoWorker> _logger;

    public RelatorioGeracaoWorker(
        IRelatorioGeracaoQueue queue,
        IServiceScopeFactory scopeFactory,
        ILogger<RelatorioGeracaoWorker> logger)
    {
        _queue = queue;
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await foreach (var relatorioId in _queue.ConsumirAsync(stoppingToken))
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var relatorioService = scope.ServiceProvider.GetRequiredService<RelatorioService>();
                await relatorioService.ProcessarGeracaoAsync(relatorioId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Falha ao processar geração em background do relatório {RelatorioId}", relatorioId);
            }
        }
    }
}
