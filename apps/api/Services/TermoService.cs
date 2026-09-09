using api.DTOs.Termo;
using api.Models;
using api.Responses;
using Data;
using Microsoft.EntityFrameworkCore;

namespace api.Services;

public class TermoService
{
    private readonly AppDbContext _db;

    public TermoService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<ServiceResponse<TermoPendenteDTO>> ObterPendentesAsync(Usuario usuario)
    {
        var resposta = new ServiceResponse<TermoPendenteDTO>();

        var aceitosIds = await _db.AceitesTermos
            .Where(a => a.UsuarioId == usuario.Id)
            .Select(a => a.TermoVersaoId)
            .ToListAsync();

        var pendentes = await _db.TermosVersoes
            .AsNoTracking()
            .Include(tv => tv.Termo)
            .Where(tv => tv.Ativo && !aceitosIds.Contains(tv.Id))
            .Select(tv => new TermoPendenteDTO
            {
                TermoVersaoId = tv.Id,
                Chave = tv.Termo.Chave,
                Nome = tv.Termo.Nome,
                Versao = tv.Versao,
                Texto = tv.Texto,
            })
            .ToListAsync();

        resposta.AdicionaObjetos(pendentes);
        return resposta;
    }

    public async Task<ServiceResponse<object>> AceitarAsync(Usuario usuario, int termoVersaoId, string? ip)
    {
        var resposta = new ServiceResponse<object>();

        var versaoExiste = await _db.TermosVersoes.AnyAsync(tv => tv.Id == termoVersaoId);
        if (!versaoExiste)
        {
            resposta.SetFalha("Versão de termo não encontrada.");
            return resposta;
        }

        var jaAceitou = await _db.AceitesTermos
            .AnyAsync(a => a.UsuarioId == usuario.Id && a.TermoVersaoId == termoVersaoId);

        if (!jaAceitou)
        {
            _db.AceitesTermos.Add(new AceiteTermo
            {
                UsuarioId = usuario.Id,
                TermoVersaoId = termoVersaoId,
                Ip = ip,
            });

            try
            {
                await _db.SaveChangesAsync();
            }
            catch (DbUpdateException)
            {
                // Constraint de unicidade (usuarioid + termoversaoid) cobre duas gravações
                // concorrentes para o mesmo par — tratamos como sucesso idempotente.
                _db.ChangeTracker.Clear();
            }
        }

        resposta.AdicionaMensagem("Termo aceito com sucesso.");
        return resposta;
    }
}
