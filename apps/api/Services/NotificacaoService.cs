using api.DTOs.Notificacao;
using api.Models;
using api.Responses;
using Data;
using Microsoft.EntityFrameworkCore;

namespace api.Services;

public class NotificacaoService
{
    private readonly AppDbContext _db;

    public NotificacaoService(AppDbContext db)
    {
        _db = db;
    }

    // Chamado pelo RelatorioGeracaoWorker (Task 4) ao fim do processamento — nunca deve
    // derrubar o worker, mas se falhar aqui o próprio SaveChanges já propaga a exceção pro
    // catch do worker, que loga e segue pro próximo item da fila.
    public async Task CriarAsync(int professorId, TipoNotificacao tipo, string titulo, string mensagem, int? relatorioId)
    {
        _db.Notificacoes.Add(new Notificacao
        {
            ProfessorId = professorId,
            Tipo = tipo,
            Titulo = titulo,
            Mensagem = mensagem,
            RelatorioId = relatorioId,
        });
        await _db.SaveChangesAsync();
    }

    public async Task<ServiceResponse<NotificacaoDTO>> ListarAsync(Usuario usuario, bool apenasNaoLidas)
    {
        var resposta = new ServiceResponse<NotificacaoDTO>();
        var professorId = usuario.ProfessorId ?? 0;
        if (professorId == 0)
        {
            resposta.SetFalha("Professor não identificado.");
            return resposta;
        }

        var query = _db.Notificacoes.AsNoTracking().Where(n => n.ProfessorId == professorId);
        if (apenasNaoLidas)
            query = query.Where(n => !n.Lida);

        var notificacoes = await query
            .OrderByDescending(n => n.CreatedAt)
            .Take(50)
            .Select(n => new NotificacaoDTO
            {
                Id = n.Id,
                Tipo = n.Tipo,
                Titulo = n.Titulo,
                Mensagem = n.Mensagem,
                RelatorioId = n.RelatorioId,
                Lida = n.Lida,
                CreatedAt = n.CreatedAt,
            })
            .ToListAsync();

        resposta.AdicionaObjetos(notificacoes);
        return resposta;
    }

    public async Task<ServiceResponse<NotificacaoDTO>> MarcarComoLidaAsync(int id, Usuario usuario)
    {
        var resposta = new ServiceResponse<NotificacaoDTO>();
        var professorId = usuario.ProfessorId ?? 0;
        if (professorId == 0)
        {
            resposta.SetFalha("Professor não identificado.");
            return resposta;
        }

        var notificacao = await _db.Notificacoes.FirstOrDefaultAsync(n => n.Id == id && n.ProfessorId == professorId);
        if (notificacao == null)
        {
            resposta.SetFalha("Notificação não encontrada.");
            return resposta;
        }

        notificacao.Lida = true;
        await _db.SaveChangesAsync();

        resposta.AdicionaObjeto(new NotificacaoDTO
        {
            Id = notificacao.Id,
            Tipo = notificacao.Tipo,
            Titulo = notificacao.Titulo,
            Mensagem = notificacao.Mensagem,
            RelatorioId = notificacao.RelatorioId,
            Lida = notificacao.Lida,
            CreatedAt = notificacao.CreatedAt,
        });
        return resposta;
    }

    public async Task<ServiceResponse<NotificacaoDTO>> MarcarTodasComoLidasAsync(Usuario usuario)
    {
        var resposta = new ServiceResponse<NotificacaoDTO>();
        var professorId = usuario.ProfessorId ?? 0;
        if (professorId == 0)
        {
            resposta.SetFalha("Professor não identificado.");
            return resposta;
        }

        var naoLidas = await _db.Notificacoes
            .Where(n => n.ProfessorId == professorId && !n.Lida)
            .ToListAsync();

        foreach (var n in naoLidas)
            n.Lida = true;

        await _db.SaveChangesAsync();
        return resposta;
    }
}
