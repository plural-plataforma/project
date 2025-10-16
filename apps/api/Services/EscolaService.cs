using api.DTOs.Escola;
using api.Models;
using api.Responses;
using Data;
using Microsoft.AspNetCore.Identity;

namespace api.Services
{
    public class EscolaService
    {
        private readonly AppDbContext _contexto;
        private readonly UserManager<Usuario> _usuario;

        public EscolaService(AppDbContext contexto, UserManager<Usuario> usuario)
        {
            _contexto = contexto;
            _usuario = usuario;
        }

        public async Task<ServiceResponse<EscolaDTO>> Cadastro(EscolaDTO escolaDTO)
        {
            var resposta = new ServiceResponse<EscolaDTO>();
            using (var transacao = await _contexto.Database.BeginTransactionAsync())
            {
                try
                {
                    Escola escola = new Escola
                    {
                        NomeInstituicao = escolaDTO.NomeInstituicao,
                        Tipo = escolaDTO.Tipo,
                        Cep = escolaDTO.Cep,
                        Logradouro = escolaDTO.Logradouro,
                        Numero = escolaDTO.Numero.HasValue ? (int)escolaDTO.Numero : 0,
                        Complemento = escolaDTO.Complemento,
                        Bairro = escolaDTO.Bairro,
                        Estado = escolaDTO.Estado,
                        Cidade = escolaDTO.Cidade
                    };
                    _contexto.Escolas.Add(escola);
                    await _contexto.SaveChangesAsync();

                    await transacao.CommitAsync();
                    resposta.Sucesso = true;
                    return resposta;
                }
                catch (Exception)
                {

                    await transacao.RollbackAsync();
                    resposta.SetFalha("Erro ao cadastrar escola.");
                    throw;
                    return resposta;
                }
            }

        }

        public async Task<ServiceResponse<List<EscolaComIdDTO>>> Buscar()
        {
            var resposta = new ServiceResponse<List<EscolaComIdDTO>>();
            try
            {
                var escolas = _contexto.Escolas.Select(e => new EscolaComIdDTO
                {
                    Id = e.ID,
                    NomeInstituicao = e.NomeInstituicao,
                    Tipo = e.Tipo,
                    Cep = e.Cep,
                    Logradouro = e.Logradouro,
                    Numero = e.Numero,
                    Complemento = e.Complemento,
                    Bairro = e.Bairro,
                    Estado = e.Estado,
                    Cidade = e.Cidade
                }).ToList();
                resposta.AdicionaObjeto(escolas);
                resposta.Sucesso = true;
                return resposta;
            }
            catch (Exception)
            {
                resposta.SetFalha("Erro ao buscar escolas.");
                return resposta;
            }
        }

        public async Task<ServiceResponse<List<EscolaComIdDTO>>> Buscar(int id)
        {
            var resposta = new ServiceResponse<List<EscolaComIdDTO>>();
            try
            {
                var escola = _contexto.Escolas.Select(e => new EscolaComIdDTO
                {
                    Id = e.ID,
                    NomeInstituicao = e.NomeInstituicao,
                    Tipo = e.Tipo,
                    Cep = e.Cep,
                    Logradouro = e.Logradouro,
                    Numero = e.Numero,
                    Complemento = e.Complemento,
                    Bairro = e.Bairro,
                    Estado = e.Estado,
                    Cidade = e.Cidade
                }).Where(e => e.Id == id).ToList();
                resposta.AdicionaObjeto(escola);
                resposta.Sucesso = true;
                return resposta;
            }
            catch (Exception)
            {
                resposta.SetFalha("Erro ao buscar escola.");
                return resposta;
            }
        }

        public async Task<ServiceResponse<EscolaComIdDTO>> Atualizar(EscolaComIdDTO escolaDTO)
        {
            var resposta = new ServiceResponse<EscolaComIdDTO>();

            try
            {
                Escola escola = await _contexto.Escolas.FindAsync(escolaDTO.Id);
                if (escola == null)
                {
                    resposta.SetFalha("Escola não encontrada.");
                    return resposta;
                }

                if (!string.IsNullOrEmpty(escolaDTO.NomeInstituicao))
                {
                    escola.NomeInstituicao = escolaDTO.NomeInstituicao;
                }

                if (!string.IsNullOrEmpty(escolaDTO.Tipo))
                {
                    escola.Tipo = escolaDTO.Tipo;
                }

                if (!string.IsNullOrEmpty(escolaDTO.Cep))
                {
                    escola.Cep = escolaDTO.Cep;
                }

                if (!string.IsNullOrEmpty(escolaDTO.Logradouro))
                {
                    escola.Logradouro = escolaDTO.Logradouro;
                }

                if (escolaDTO.Numero.HasValue)
                {
                    escola.Numero = (int)escolaDTO.Numero;
                }

                if (!string.IsNullOrEmpty(escolaDTO.Complemento))
                {
                    escola.Complemento = escolaDTO.Complemento;
                }

                if (!string.IsNullOrEmpty(escolaDTO.Bairro))
                {
                    escola.Bairro = escolaDTO.Bairro;
                }

                if (!string.IsNullOrEmpty(escolaDTO.Estado))
                {
                    escola.Estado = escolaDTO.Estado;
                }

                if (!string.IsNullOrEmpty(escolaDTO.Cidade))
                {
                    escola.Cidade = escolaDTO.Cidade;
                }

                await _contexto.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                resposta.SetFalha(ex.Message);
                return resposta;
            }

            resposta.AdicionaMensagem("Cadastro de escola atualizado com sucesso.");
            return resposta;
        }

    }
}
