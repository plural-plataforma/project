using api.DTOs.Avaliacao;
using api.Models;
using api.Responses;
using Data;
using Microsoft.EntityFrameworkCore;

namespace api.Services;

public class AvaliacaoService
{
    private readonly AppDbContext _contexto;

    public AvaliacaoService(AppDbContext contexto)
    {
        _contexto = contexto;
    }

    public async Task<ServiceResponse<List<AvaliacaoBuscarDTO>>> GetAvaliacoesAtivas()
    {
        var resposta = new ServiceResponse<List<AvaliacaoBuscarDTO>>();
        try
        {
            var lista = await _contexto.Avaliacao
                .AsNoTracking()
                .Where(a => a.Ativo)
                .OrderBy(a => a.Id)
                .Select(a => new AvaliacaoBuscarDTO
                {
                    Id = a.Id,
                    Descricao = a.Descricao,
                    Resumo = a.Resumo,
                    Ativo = a.Ativo,
                })
                .ToListAsync();
            resposta.AdicionaObjeto(lista);
            resposta.Sucesso = true;
            return resposta;
        }
        catch (Exception)
        {
            resposta.SetFalha("Erro ao buscar critérios avaliativos.");
            return resposta;
        }
    }

    public async Task<ServiceResponse<List<AvaliacaoBuscarDTO>>> GetAvaliacoes()
    {
        var resposta = new ServiceResponse<List<AvaliacaoBuscarDTO>>();
        try
        {
            var lista = await _contexto.Avaliacao
                .AsNoTracking()
                .OrderBy(a => a.Id)
                .Select(a => new AvaliacaoBuscarDTO
                {
                    Id = a.Id,
                    Descricao = a.Descricao,
                    Resumo = a.Resumo,
                    Ativo = a.Ativo,
                })
                .ToListAsync();
            resposta.AdicionaObjeto(lista);
            resposta.Sucesso = true;
            return resposta;
        }
        catch (Exception)
        {
            resposta.SetFalha("Erro ao buscar critérios avaliativos.");
            return resposta;
        }
    }
}
