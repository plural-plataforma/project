using System.Threading.Channels;

namespace api.Services;

// Fila em memória (não persistida): se a API reiniciar com itens na fila, o relatório fica
// preso em Status.Gerando — o professor tem o botão "Gerar novamente" na tela do relatório
// como caminho de recuperação manual, então não introduzimos fila durável aqui (YAGNI).
public class RelatorioGeracaoQueue : IRelatorioGeracaoQueue
{
    private readonly Channel<int> _channel = Channel.CreateUnbounded<int>();

    public void Enfileirar(int relatorioId)
    {
        _channel.Writer.TryWrite(relatorioId);
    }

    public IAsyncEnumerable<int> ConsumirAsync(CancellationToken cancellationToken)
    {
        return _channel.Reader.ReadAllAsync(cancellationToken);
    }
}
