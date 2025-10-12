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

    }
}
