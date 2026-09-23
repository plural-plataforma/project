using api.DTOs;
using api.DTOs.Habilidade;
using api.Helpers;
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

        public async Task<ServiceResponse<HabilidadeBuscarDTO>> Cadastro(HabilidadeCadastroDTO habilidadeDTO, Usuario usuario)
        {
            var resposta = new ServiceResponse<HabilidadeBuscarDTO>();

            if (string.IsNullOrWhiteSpace(habilidadeDTO.Tipo) || string.IsNullOrWhiteSpace(habilidadeDTO.Descricao))
            {
                resposta.SetFalha("Tipo e descrição são obrigatórios.");
                return resposta;
            }

            var ehAdmin = await _usuario.IsInRoleAsync(usuario, "Admin");
            if (!ehAdmin && usuario.ProfessorId == null)
            {
                resposta.SetFalha("Professor não identificado.");
                return resposta;
            }

            using (var transacao = await _contexto.Database.BeginTransactionAsync())
            {
                try
                {
                    Habilidade habilidade = new Habilidade()
                    {
                        IdNivelEnsino = habilidadeDTO.IdNivelEnsino,
                        Tipo = habilidadeDTO.Tipo.Trim(),
                        Descricao = habilidadeDTO.Descricao.Trim(),
                        Resumo = string.IsNullOrWhiteSpace(habilidadeDTO.Resumo) ? "" : habilidadeDTO.Resumo.Trim(),
                        Ativo = true,
                        IdProfessor = ehAdmin ? null : usuario.ProfessorId
                    };
                    _contexto.Habilidades.Add(habilidade);
                    await _contexto.SaveChangesAsync();

                    await transacao.CommitAsync();
                    resposta.Sucesso = true;
                    resposta.AdicionaObjeto(MapearParaDTO(habilidade));
                    resposta.AdicionaMensagem("Cadastro de habilidade realizado com sucesso.");
                    return resposta;
                }
                catch (Exception)
                {
                    await transacao.RollbackAsync();
                    resposta.SetFalha("Erro ao cadastrar habilidade.");
                    throw;
                }
            }
        }

        public async Task<ServiceResponse<HabilidadeAtualizarDTO>> Atualizar(HabilidadeAtualizarDTO habilidadeDTO, Usuario usuario)
        {
            var resposta = new ServiceResponse<HabilidadeAtualizarDTO>();

            try
            {
                var ehAdmin = await _usuario.IsInRoleAsync(usuario, "Admin");
                if (!ehAdmin && usuario.ProfessorId == null)
                {
                    resposta.SetFalha("Professor não identificado.");
                    return resposta;
                }

                // Professora só altera as próprias (IdProfessor não nulo evita casar com globais);
                // Admin altera as globais e as próprias, nunca a privada de outra professora.
                var professorId = usuario.ProfessorId;
                Habilidade? habilidade = await _contexto.Habilidades.FirstOrDefaultAsync(h =>
                    h.Id == habilidadeDTO.Id &&
                    ((ehAdmin && h.IdProfessor == null) || (h.IdProfessor != null && h.IdProfessor == professorId)));
                if (habilidade == null)
                {
                    resposta.SetFalha("Habilidade não encontrada.");
                    return resposta;
                }

                if (habilidadeDTO.IdNivelEnsino.HasValue && habilidadeDTO.IdNivelEnsino != 0)
                {
                    habilidade.IdNivelEnsino = (int)habilidadeDTO.IdNivelEnsino;
                }

                if (!string.IsNullOrWhiteSpace(habilidadeDTO.Tipo))
                {
                    habilidade.Tipo = habilidadeDTO.Tipo.Trim();
                }

                if (!string.IsNullOrWhiteSpace(habilidadeDTO.Descricao))
                {
                    habilidade.Descricao = habilidadeDTO.Descricao.Trim();
                }

                if (!string.IsNullOrEmpty(habilidadeDTO.Resumo))
                {
                    habilidade.Resumo = habilidadeDTO.Resumo.Trim();
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

        public async Task<ServiceResponse<List<HabilidadeBuscarDTO>>> Buscar(Usuario usuario)
        {
            var resposta = new ServiceResponse<List<HabilidadeBuscarDTO>>();
            try
            {
                // Nem Admin enxerga habilidade privada de outra professora: globais + próprias.
                var habilidades = await _contexto.Habilidades
                    .AsNoTracking()
                    .VisiveisParaProfessor(usuario.ProfessorId)
                    .Select(h => new HabilidadeBuscarDTO
                    {
                        Id = h.Id,
                        IdNivelEnsino = h.IdNivelEnsino,
                        Tipo = h.Tipo,
                        Descricao = h.Descricao,
                        Resumo = h.Resumo,
                        Ativo = h.Ativo,
                        EhPropria = h.IdProfessor != null
                    })
                    .ToListAsync();
                resposta.AdicionaObjeto(habilidades);
                resposta.Sucesso = true;
                return resposta;
            }
            catch (Exception)
            {
                resposta.SetFalha("Erro ao buscar habilidades.");
                return resposta;
            }
        }

        private static HabilidadeBuscarDTO MapearParaDTO(Habilidade habilidade)
        {
            return new HabilidadeBuscarDTO
            {
                Id = habilidade.Id,
                IdNivelEnsino = habilidade.IdNivelEnsino,
                Tipo = habilidade.Tipo,
                Descricao = habilidade.Descricao,
                Resumo = habilidade.Resumo,
                Ativo = habilidade.Ativo,
                EhPropria = habilidade.IdProfessor != null
            };
        }
    }
}
