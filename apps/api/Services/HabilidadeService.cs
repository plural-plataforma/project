using api.DTOs.Aluno;
using api.Models;
using api.Responses;
using Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace api.Services
{
    public class HabilidadeService
    {
        private readonly AppDbContext _contexto;
        private readonly UserManager<Usuario> _usuario;

        public HabilidadeService(AppDbContext contexto, UserManager<Usuario> usuario)
        {
            _contexto = contexto;
            _usuario = usuario;
        }

        public async Task<ServiceResponse<HabilidadeDTO>> Cadastro(HabilidadeDTO habilidadeDTO)
        {
            var resposta = new ServiceResponse<HabilidadeDTO>();
            using (var transacao = await _contexto.Database.BeginTransactionAsync())
            {
                try
                {
                    Habilidade habilidade = new Habilidade()
                    {
                        NivelEnsino = habilidadeDTO.NivelEnsino,
                        Tipo = habilidadeDTO.Tipo,
                        Descricao = habilidadeDTO.Descricao,
                        Resumo = string.IsNullOrEmpty(habilidadeDTO.Resumo) ? "" : habilidadeDTO.Resumo,
                        Ativo = true
                    };
                    _contexto.Habilidades.Add(habilidade);
                    await _contexto.SaveChangesAsync();

                    await transacao.CommitAsync();
                    resposta.Sucesso = true;
                    resposta.AdicionaMensagem("Cadastro de habilidade realizado com sucesso.");
                    return resposta;
                }
                catch (Exception)
                {

                    await transacao.RollbackAsync();
                    resposta.SetFalha("Erro ao cadastrar habilidade.");
                    throw;
                    return resposta;
                }
            }

        }

        public async Task<ServiceResponse<HabilidadeCompletoDTO>> Atualizar(HabilidadeCompletoDTO habilidadeDTO)
        {
            var resposta = new ServiceResponse<HabilidadeCompletoDTO>();

            try
            {
                Habilidade habilidade = await _contexto.Habilidades.FirstOrDefaultAsync(h => h.ID == habilidadeDTO.ID);
                if (habilidade == null)
                {
                    resposta.SetFalha("Habilidade não encontrada.");
                    return resposta;
                }

                if (!string.IsNullOrEmpty(habilidadeDTO.NivelEnsino))
                {
                    habilidade.NivelEnsino = habilidadeDTO.NivelEnsino;
                }

                if (!string.IsNullOrEmpty(habilidadeDTO.Tipo))
                {
                    habilidade.Tipo = habilidadeDTO.Tipo;
                }

                if (!string.IsNullOrEmpty(habilidadeDTO.Descricao))
                {
                    habilidade.Descricao = habilidadeDTO.Descricao;
                }

                if (!string.IsNullOrEmpty(habilidadeDTO.Resumo))
                {
                    habilidade.Resumo = habilidadeDTO.Resumo;
                }

                if (habilidadeDTO.Ativo.HasValue)
                {
                    habilidade.Ativo = (bool)habilidadeDTO.Ativo;
                }

                await _contexto.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                resposta.SetFalha(ex.Message);
                return resposta;
            }

            resposta.AdicionaMensagem("Atualização de habilidade realizada com sucesso.");
            return resposta;
        }



        public async Task<ServiceResponse<List<HabilidadeCompletoDTO>>> Buscar()
        {
            var resposta = new ServiceResponse<List<HabilidadeCompletoDTO>>();
            try
            {
                var habilidade = _contexto.Habilidades.
                    Select(h => new HabilidadeCompletoDTO
                    {
                        ID = h.ID,
                        NivelEnsino = h.NivelEnsino,
                        Tipo = h.Tipo,
                        Descricao= h.Descricao,
                        Resumo = h.Resumo,
                        Ativo = h.Ativo
                    }).ToList();
                resposta.AdicionaObjeto(habilidade);
                resposta.Sucesso = true;
                return resposta;
            }
            catch (Exception)
            {
                resposta.SetFalha("Erro ao buscar habilidades.");
                return resposta;
            }
        }
    }
}
