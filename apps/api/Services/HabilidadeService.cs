using api.DTOs;
using api.DTOs.Habilidade;
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

        public async Task<ServiceResponse<HabilidadeCadastroDTO>> Cadastro(HabilidadeCadastroDTO habilidadeDTO)
        {
            var resposta = new ServiceResponse<HabilidadeCadastroDTO>();
            using (var transacao = await _contexto.Database.BeginTransactionAsync())
            {
                try
                {
                    Habilidade habilidade = new Habilidade()
                    {
                        IdNivelEnsino = habilidadeDTO.IdNivelEnsino,
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

        public async Task<ServiceResponse<HabilidadeAtualizarDTO>> Atualizar(HabilidadeAtualizarDTO habilidadeDTO)
        {
            var resposta = new ServiceResponse<HabilidadeAtualizarDTO>();

            try
            {
                Habilidade habilidade = await _contexto.Habilidades.FirstOrDefaultAsync(h => h.Id == habilidadeDTO.Id);
                if (habilidade == null)
                {
                    resposta.SetFalha("Habilidade não encontrada.");
                    return resposta;
                }

                if (habilidadeDTO.IdNivelEnsino.HasValue && habilidadeDTO.IdNivelEnsino != 0)
                {
                    habilidade.IdNivelEnsino = (int)habilidadeDTO.IdNivelEnsino;
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



        public async Task<ServiceResponse<List<HabilidadeBuscarDTO>>> Buscar()
        {
            var resposta = new ServiceResponse<List<HabilidadeBuscarDTO>>();
            try
            {
                var habilidade = _contexto.Habilidades.
                    Select(h => new HabilidadeBuscarDTO
                    {
                        Id = h.Id,
                        IdNivelEnsino = h.IdNivelEnsino,
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
