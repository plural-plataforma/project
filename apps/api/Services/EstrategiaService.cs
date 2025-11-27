using api.DTOs;
using api.DTOs.Estrategia;
using api.DTOs.Habilidade;
using api.Models;
using api.Responses;
using Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;


namespace api.Services
{ 
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


        public async Task<ServiceResponse<EstrategiaAtualizarDTO>> Atualizar(int id, EstrategiaAtualizarDTO estrategiaDTO)
        {
            var resposta = new ServiceResponse<EstrategiaAtualizarDTO>();

            if (estrategiaDTO.Id != id)
            {
                resposta.SetFalha("ID do corpo da requisição diferente do ID da URL.");
                return resposta;
            }

            try
            {
                var estrategia = await _contexto.Estrategias
                    .FirstOrDefaultAsync(e => e.Id == id);

                if (estrategia == null)
                {
                    resposta.SetFalha($"Estratégia com ID {id} não encontrada.");
                    return resposta;
                }

                if (!string.IsNullOrWhiteSpace(estrategiaDTO.Descricao))
                {
                    estrategia.Descricao = estrategiaDTO.Descricao.Trim();
                }

                if (estrategiaDTO.Ativo.HasValue)
                {
                    estrategia.Ativo = estrategiaDTO.Ativo.Value;
                }

                await _contexto.SaveChangesAsync();

                resposta.Sucesso = true;
                resposta.AdicionaMensagem("Estratégia atualizada com sucesso.");
                resposta.AdicionaObjeto(estrategiaDTO);
                return resposta;
            }
            catch (Exception ex)
            {
                resposta.SetFalha("Erro ao atualizar estratégia: " + ex.Message);
                return resposta;
            }
        }

        public async Task<ServiceResponse<EstrategiaBuscarDTO>> GetEstrategiaPorId(int id)
        {
            var resposta = new ServiceResponse<EstrategiaBuscarDTO>();

            try
            {
                var estrategia = await _contexto.Estrategias
                    .Where(e => e.Id == id)
                    .Select(e => new EstrategiaBuscarDTO
                    {
                        Id = e.Id,
                        Descricao = e.Descricao,
                        Ativo = e.Ativo
                    })
                    .FirstOrDefaultAsync();

                if (estrategia == null)
                {
                    resposta.SetFalha($"Estratégia com ID {id} não encontrada.");
                    return resposta;
                }

                resposta.AdicionaObjeto(estrategia);
                resposta.Sucesso = true;
                resposta.AdicionaMensagem("Estratégia encontrada com sucesso.");
                return resposta;
            }
            catch (Exception ex)
            {
                resposta.SetFalha("Erro ao buscar estratégia: " + ex.Message);
                return resposta;
            }
        }
    }  
}