using api.DTOs.Estrategia;
using api.DTOs;
using api.Models;
using api.Responses;
using Data;
using Microsoft.AspNetCore.Identity;

    public class EstrategiaService
    {

        private readonly AppDbContext _contexto;
        private readonly UserManager<Usuario> _usuario;

        public EstrategiaService(AppDbContext contexto, UserManager<Usuario> usuario)
        {
            _contexto = contexto;
            _usuario = usuario;
        }

        public async Task<ServiceResponse<List<EstrategiaBuscarDTO>>> GetEstrategias()
        {
            var resposta = new ServiceResponse<List<EstrategiaBuscarDTO>>();
            try
            {
                var estrategia = _contexto.Estrategias.
                    Select(h => new EstrategiaBuscarDTO
                    {
                        Id = h.Id,
                        Descricao = h.Descricao,
                        Ativo = h.Ativo
                    }).ToList();
                resposta.AdicionaObjeto(estrategia);
                resposta.Sucesso = true;
                return resposta;
            }
            catch (Exception)
            {
                resposta.SetFalha("Erro ao buscar estrategias.");
                return resposta;
            }
        }

    public async Task<ServiceResponse<List<EstrategiaBuscarDTO>>> GetEstrategiasAtivas()
    {
        var resposta = new ServiceResponse<List<EstrategiaBuscarDTO>>();
        try
        {
            var estrategia = _contexto.Estrategias
                .Where(e => e.Ativo)
                .Select(h => new EstrategiaBuscarDTO
                {
                    Id = h.Id,
                    Descricao = h.Descricao
                }).ToList();
            resposta.AdicionaObjeto(estrategia);
            resposta.Sucesso = true;
            return resposta;
        }
        catch (Exception)
        {
            resposta.SetFalha("Erro ao buscar estrategias.");
            return resposta;
        }
    }
    public async Task<ServiceResponse<EstrategiaCadastroDTO>> Cadastro(EstrategiaCadastroDTO estrategiaDTO)
        {
            var resposta = new ServiceResponse<EstrategiaCadastroDTO>();
            using (var transacao = await _contexto.Database.BeginTransactionAsync())
            {
                try
                {
                    Estrategias estrategia = new Estrategias()
                    {
                        Descricao = estrategiaDTO.Descricao,
                        Ativo = true
                    };
                    _contexto.Estrategias.Add(estrategia);
                    await _contexto.SaveChangesAsync();

                    await transacao.CommitAsync();
                    resposta.Sucesso = true;
                    resposta.AdicionaMensagem("Cadastro de estratégia realizado com sucesso.");
                    return resposta;
                }
                catch (Exception)
                {

                    await transacao.RollbackAsync();
                    resposta.SetFalha("Erro ao cadastrar estratégia.");
                    throw;
                    return resposta;
                }
            }

        }
    }
