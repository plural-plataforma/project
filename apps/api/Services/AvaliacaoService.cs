using api.DTOs;
using api.DTOs.Avaliacao;
using api.Models;
using api.Responses;
using Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;


namespace api.Services
{
    public class AvaliacaoService
    {

        private readonly AppDbContext _contexto;
        private readonly UserManager<Usuario> _usuario;

        public AvaliacaoService(AppDbContext contexto, UserManager<Usuario> usuario)
        {
            _contexto = contexto;
            _usuario = usuario;
        }

        public async Task<ServiceResponse<List<AvaliacaoBuscarDTO>>> GetAvaliacoes()
        {
            var resposta = new ServiceResponse<List<AvaliacaoBuscarDTO>>();
            try
            {
                var avaliacao = _contexto.Avaliacao.
                    Select(h => new AvaliacaoBuscarDTO
                    {
                        Id = h.Id,
                        Descricao = h.Descricao,
                        Resumo = h.Resumo,
                        Ativo = h.Ativo
                    }).ToList();
                resposta.AdicionaObjeto(avaliacao);
                resposta.Sucesso = true;
                return resposta;
            }
            catch (Exception)
            {
                resposta.SetFalha("Erro ao buscar avaliações.");
                return resposta;
            }
        }

        public async Task<ServiceResponse<List<AvaliacaoBuscarDTO>>> GetAvaliacoesAtivas()
        {
            var resposta = new ServiceResponse<List<AvaliacaoBuscarDTO>>();
            try
            {
                var avalicao = _contexto.Avaliacao
                    .Where(e => e.Ativo)
                    .Select(h => new AvaliacaoBuscarDTO
                    {
                        Id = h.Id,
                        Descricao = h.Descricao,
                        Resumo = h.Resumo
                    }).ToList();
                resposta.AdicionaObjeto(avalicao);
                resposta.Sucesso = true;
                return resposta;
            }
            catch (Exception)
            {
                resposta.SetFalha("Erro ao buscar avaliações.");
                return resposta;
            }
        }
        public async Task<ServiceResponse<AvaliacaoCadastroDTO>> Cadastro(AvaliacaoCadastroDTO avaliacaoDTO)
        {
            var resposta = new ServiceResponse<AvaliacaoCadastroDTO>();
            using (var transacao = await _contexto.Database.BeginTransactionAsync())
            {
                try
                {
                    Avaliacao avaliacao = new Avaliacao()
                    {
                        Descricao = avaliacaoDTO.Descricao,
                        Resumo = avaliacaoDTO.Resumo,
                        Ativo = true
                    };
                    _contexto.Avaliacao.Add(avaliacao);
                    await _contexto.SaveChangesAsync();

                    await transacao.CommitAsync();
                    resposta.Sucesso = true;
                    resposta.AdicionaMensagem("Cadastro de avaliação realizado com sucesso.");
                    return resposta;
                }
                catch (Exception)
                {

                    await transacao.RollbackAsync();
                    resposta.SetFalha("Erro ao cadastrar avaliação.");
                    throw;
                    return resposta;
                }
            }

        }


        public async Task<ServiceResponse<AvaliacaoAtualizarDTO>> Atualizar(int id, AvaliacaoAtualizarDTO avaliacaoAtualizarDTO)
        {
            var resposta = new ServiceResponse<AvaliacaoAtualizarDTO>();

            if (avaliacaoAtualizarDTO.Id != id)
            {
                resposta.SetFalha("ID do corpo da requisição diferente do ID da URL.");
                return resposta;
            }

            try
            {
                var avaliacao = await _contexto.Avaliacao
                    .FirstOrDefaultAsync(e => e.Id == id);

                if (avaliacao == null)
                {
                    resposta.SetFalha($"Avaliação com ID {id} não encontrada.");
                    return resposta;
                }

                if (!string.IsNullOrWhiteSpace(avaliacaoAtualizarDTO.Descricao))
                {
                    avaliacao.Descricao = avaliacaoAtualizarDTO.Descricao.Trim();
                }

                if (!string.IsNullOrWhiteSpace(avaliacaoAtualizarDTO.Resumo))
                {
                    avaliacao.Resumo = avaliacaoAtualizarDTO.Resumo.Trim();
                }


                if (avaliacaoAtualizarDTO.Ativo.HasValue)
                {
                    avaliacao.Ativo = avaliacaoAtualizarDTO.Ativo.Value;
                }

                await _contexto.SaveChangesAsync();

                resposta.Sucesso = true;
                resposta.AdicionaMensagem("Avaliação atualizada com sucesso.");
                resposta.AdicionaObjeto(avaliacaoAtualizarDTO);
                return resposta;
            }
            catch (Exception ex)
            {
                resposta.SetFalha("Erro ao atualizar avaliação: " + ex.Message);
                return resposta;
            }
        }

        public async Task<ServiceResponse<AvaliacaoBuscarDTO>> GetAvaliacaoPorId(int id)
        {
            var resposta = new ServiceResponse<AvaliacaoBuscarDTO>();

            try
            {
                var avaliacao = await _contexto.Avaliacao
                    .Where(e => e.Id == id)
                    .Select(e => new AvaliacaoBuscarDTO
                    {
                        Id = e.Id,
                        Descricao = e.Descricao,
                        Resumo = e.Resumo,
                        Ativo = e.Ativo
                    })
                    .FirstOrDefaultAsync();

                if (avaliacao == null)
                {
                    resposta.SetFalha($"Avaliação com ID {id} não encontrada.");
                    return resposta;
                }

                resposta.AdicionaObjeto(avaliacao);
                resposta.Sucesso = true;
                resposta.AdicionaMensagem("Avaliação encontrada com sucesso.");
                return resposta;
            }
            catch (Exception ex)
            {
                resposta.SetFalha("Erro ao buscar avaliação: " + ex.Message);
                return resposta;
            }
        }
    }
}