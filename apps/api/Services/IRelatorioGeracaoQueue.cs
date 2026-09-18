namespace api.Services;

public enum RelatorioProcessamento
{
    Geracao = 0,
    RevisaoFinal = 1,
}

public interface IRelatorioGeracaoQueue
{
    void Enfileirar(int relatorioId, RelatorioProcessamento tipo);
    IAsyncEnumerable<(int RelatorioId, RelatorioProcessamento Tipo)> ConsumirAsync(CancellationToken cancellationToken);
}
