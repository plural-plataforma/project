using api.DTOs.Autenticacao;
using api.DTOs.Escola;
using api.DTOs.Professor;
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
                        Numero = escolaDTO.Numero,
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

        public async Task<ServiceResponse<List<EscolaBuscarDTO>>> Buscar()
        {
            var resposta = new ServiceResponse<List<EscolaBuscarDTO>>();
            try
            {
                var escolas = _contexto.Escolas.Select(e => new EscolaBuscarDTO
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

        public async Task<ServiceResponse<List<EscolaBuscarDTO>>> Buscar(int id)
        {
            var resposta = new ServiceResponse<List<EscolaBuscarDTO>>();
            try
            {
                var escola = _contexto.Escolas.Select(e => new EscolaBuscarDTO
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
    }
}
