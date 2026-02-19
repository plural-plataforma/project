using api.DTOs.Atividade;
using api.DTOs.Bloco;
using api.Models;
using api.Responses;
using Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace api.Services
{
    public class BlocoService
    {
        private readonly AppDbContext _contexto;
        private readonly UserManager<Usuario> _usuario;

        public BlocoService(AppDbContext contexto, UserManager<Usuario> usuario)
        {
            _contexto = contexto;
            _usuario = usuario;
        }

        // Listagem de todos os blocos (sem filtro de ativo)
        public async Task<ServiceResponse<List<BlocoBuscarDTO>>> GetBlocos()
        {
            var resposta = new ServiceResponse<List<BlocoBuscarDTO>>();

            try
            {
                var blocos = await _contexto.Blocos
                    .OrderBy(b => b.Ordem)
                    .ThenBy(b => b.Titulo)
                    .Select(b => new BlocoBuscarDTO
                    {
                        Id = b.Id,
                        Titulo = b.Titulo,
                        Ordem = b.Ordem,
                        Observacao = b.Observacao,
                        Icone = b.Icone,
                        CreatedAt = b.CreatedAt,
                        UpdatedAt = b.UpdatedAt,
                        Status = b.Status,
                    //    QuantidadeAtividades = b.Atividades != null ? b.Atividades.Count : 0
                    })
                    .ToListAsync();

                resposta.AdicionaObjeto(blocos);
                resposta.Sucesso = true;
                return resposta;
            }
            catch (Exception)
            {
                resposta.SetFalha("Erro ao buscar blocos.");
                return resposta;
            }
        }

        // Listagem apenas dos blocos ativos
        public async Task<ServiceResponse<List<BlocoBuscarDTO>>> GetBlocosAtivos()
        {
            var resposta = new ServiceResponse<List<BlocoBuscarDTO>>();

            try
            {
                var blocos = await _contexto.Blocos
                    .Where(b => b.Status)
                    .OrderBy(b => b.Ordem)
                    .ThenBy(b => b.Titulo)
                    .Select(b => new BlocoBuscarDTO
                    {
                        Id = b.Id,
                        Titulo = b.Titulo,
                        Ordem = b.Ordem,
                        Observacao = b.Observacao,
                        Icone = b.Icone,
                       // QuantidadeAtividades = b.Atividades != null ? b.Atividades.Count : 0
                    })
                    .ToListAsync();

                resposta.AdicionaObjeto(blocos);
                resposta.Sucesso = true;
                return resposta;
            }
            catch (Exception)
            {
                resposta.SetFalha("Erro ao buscar blocos ativos.");
                return resposta;
            }
        }

        // Buscar um bloco específico por ID
        public async Task<ServiceResponse<BlocoBuscarDTO>> GetBlocoPorId(int id)
        {
            var resposta = new ServiceResponse<BlocoBuscarDTO>();

            try
            {
                var bloco = await _contexto.Blocos
                    .Where(b => b.Id == id)
                    .Select(b => new BlocoBuscarDTO
                    {
                        Id = b.Id,
                        Titulo = b.Titulo,
                        Ordem = b.Ordem,
                        Observacao = b.Observacao,
                        Icone = b.Icone,
                        CreatedAt = b.CreatedAt,
                        UpdatedAt = b.UpdatedAt,
                        Status = b.Status,
                       // QuantidadeAtividades = b.Atividades != null ? b.Atividades.Count : 0
                    })
                    .FirstOrDefaultAsync();

                if (bloco == null)
                {
                    resposta.SetFalha($"Bloco com ID {id} não encontrado.");
                    return resposta;
                }

                resposta.AdicionaObjeto(bloco);
                resposta.Sucesso = true;
                resposta.AdicionaMensagem("Bloco encontrado com sucesso.");
                return resposta;
            }
            catch (Exception ex)
            {
                resposta.SetFalha("Erro ao buscar bloco: " + ex.Message);
                return resposta;
            }
        }

        // Cadastro de novo bloco
        public async Task<ServiceResponse<BlocoCadastroDTO>> Cadastro(BlocoCadastroDTO blocoDTO)
        {
            var resposta = new ServiceResponse<BlocoCadastroDTO>();

            using (var transacao = await _contexto.Database.BeginTransactionAsync())
            {
                try
                {
                    var bloco = new Bloco
                    {
                        Titulo = blocoDTO.Titulo?.Trim() ?? "",
                        Ordem = blocoDTO.Ordem,
                        Observacao = blocoDTO.Observacao?.Trim(),
                        Icone = blocoDTO.Icone?.Trim(),
                        Status = true,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                        // Atividades não são criadas aqui (relação posterior)
                    };

                    _contexto.Blocos.Add(bloco);
                    await _contexto.SaveChangesAsync();
                    await transacao.CommitAsync();

                    resposta.Sucesso = true;
                    resposta.AdicionaMensagem("Cadastro de bloco realizado com sucesso.");
                    return resposta;
                }
                catch (Exception)
                {
                    await transacao.RollbackAsync();
                    resposta.SetFalha("Erro ao cadastrar bloco.");
                    return resposta;
                }
            }
        }

        // Atualização de bloco existente
        public async Task<ServiceResponse<BlocoAtualizarDTO>> Atualizar(int id, BlocoAtualizarDTO blocoAtualizarDTO)
        {
            var resposta = new ServiceResponse<BlocoAtualizarDTO>();

            if (blocoAtualizarDTO.Id != id)
            {
                resposta.SetFalha("ID do corpo da requisição diferente do ID da URL.");
                return resposta;
            }

            try
            {
                var bloco = await _contexto.Blocos
                    .FirstOrDefaultAsync(b => b.Id == id);

                if (bloco == null)
                {
                    resposta.SetFalha($"Bloco com ID {id} não encontrado.");
                    return resposta;
                }

                // Atualiza apenas os campos enviados (estilo parcial)
                if (!string.IsNullOrWhiteSpace(blocoAtualizarDTO.Titulo))
                    bloco.Titulo = blocoAtualizarDTO.Titulo.Trim();

                if (blocoAtualizarDTO.Ordem.HasValue)
                    bloco.Ordem = blocoAtualizarDTO.Ordem.Value;

                if (!string.IsNullOrWhiteSpace(blocoAtualizarDTO.Observacao))
                    bloco.Observacao = blocoAtualizarDTO.Observacao.Trim();

                if (!string.IsNullOrWhiteSpace(blocoAtualizarDTO.Icone))
                    bloco.Icone = blocoAtualizarDTO.Icone.Trim();

                if (blocoAtualizarDTO.Status.HasValue)
                    bloco.Status = blocoAtualizarDTO.Status.Value;

                bloco.UpdatedAt = DateTime.UtcNow;

                await _contexto.SaveChangesAsync();

                resposta.Sucesso = true;
                resposta.AdicionaMensagem("Bloco atualizado com sucesso.");
                resposta.AdicionaObjeto(blocoAtualizarDTO);
                return resposta;
            }
            catch (Exception ex)
            {
                resposta.SetFalha("Erro ao atualizar bloco: " + ex.Message);
                return resposta;
            }
        }

        // Exclusão soft (desativa o bloco)
        public async Task<ServiceResponse<bool>> Excluir(int id)
        {
            var resposta = new ServiceResponse<bool>();

            try
            {
                var bloco = await _contexto.Blocos
                    .FirstOrDefaultAsync(b => b.Id == id);

                if (bloco == null)
                {
                    resposta.SetFalha($"Bloco com ID {id} não encontrado.");
                    return resposta;
                }

                bloco.Status = false;
                bloco.UpdatedAt = DateTime.UtcNow;

                await _contexto.SaveChangesAsync();

                resposta.Sucesso = true;
                resposta.AdicionaMensagem("Bloco excluído com sucesso (desativado).");
                resposta.AdicionaObjeto(true);
                return resposta;
            }
            catch (Exception ex)
            {
                resposta.SetFalha("Erro ao excluir bloco: " + ex.Message);
                return resposta;
            }
        }
        // Retorna todos os blocos ativos com todas as suas atividades ativas
        public async Task<ServiceResponse<List<BlocoComAtividadesDTO>>> GetBlocosComAtividades()
        {
            var resposta = new ServiceResponse<List<BlocoComAtividadesDTO>>();

            try
            {
                var blocos = await _contexto.Blocos
                    .Where(b => b.Status)
                    .OrderBy(b => b.Ordem)
                    .Select(b => new BlocoComAtividadesDTO
                    {
                        Id = b.Id,
                        Titulo = b.Titulo,
                        Ordem = b.Ordem,
                        Observacao = b.Observacao,
                        Icone = b.Icone,
                        QuantidadeAtividades = b.Atividades.Count(a => a.Ativo),
                        Atividades = b.Atividades
                            .Where(a => a.Ativo)
                            .Select(a => new AtividadeBuscarDTO
                            {
                                Id = a.Id,
                                Titulo = a.Titulo,
                                Enunciado = a.Enunciado,
                                BlocoId = a.BlocoId,
                                Nivel = a.Nivel.ToString(),
                                EtapaMin = a.EtapaMin,
                                EtapaMax = a.EtapaMax,
                                ImagemUrl = a.ImagemUrl,
                                Ativo = a.Ativo,
                                HabilidadeIds = a.Habilidades.Select(h => h.Id).ToList()
                            })
                            .OrderBy(a => a.Titulo) // ou .OrderBy(a => a.Id) se preferir
                            .ToList()
                    })
                    .ToListAsync();

                // Opcional: filtrar apenas blocos que têm pelo menos uma atividade ativa
                // var blocosComAtividades = blocos.Where(b => b.QuantidadeAtividades > 0).ToList();
                // resposta.AdicionaObjeto(blocosComAtividades);

                resposta.AdicionaObjeto(blocos);
                resposta.Sucesso = true;
                resposta.AdicionaMensagem("Blocos com atividades carregados com sucesso.");
                return resposta;
            }
            catch (Exception ex)
            {
                resposta.SetFalha("Erro ao buscar blocos com atividades: " + ex.Message);
                return resposta;
            }
        }
    }
}

