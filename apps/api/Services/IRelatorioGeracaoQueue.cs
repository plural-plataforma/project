namespace api.Services;

public interface IRelatorioGeracaoQueue
{
    void Enfileirar(int relatorioId);
    IAsyncEnumerable<int> ConsumirAsync(CancellationToken cancellationToken);
}
