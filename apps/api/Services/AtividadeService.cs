using api.DTOs.Atividade;
using api.Models;
using api.Responses;
using Data;
using Microsoft.EntityFrameworkCore;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text.Json;

namespace api.Services
{
    public class AtividadeService
    {
        private readonly AppDbContext _contexto;
        public AtividadeService(AppDbContext contexto)
        {
            _contexto = contexto;
        }

        // Listagem com paginação e filtros
        public async Task<ServiceResponse<List<AtividadeBuscarDTO>>> GetAtividades(
            string? busca = null, int? blocoId = null, string? nivel = null, string? etapa = null, bool? ativo = null,
            int page = 1, int pageSize = 10)
        {
            var resposta = new ServiceResponse<List<AtividadeBuscarDTO>>();

            try
            {
                var query = _contexto.Atividades
                    .Include(a => a.Habilidades)
                    .AsQueryable();

                if (!string.IsNullOrWhiteSpace(busca))
                    query = query.Where(a => a.Titulo.Contains(busca));

                if (blocoId.HasValue)
                    query = query.Where(a => a.BlocoId == blocoId.Value);

                if (!string.IsNullOrWhiteSpace(nivel) && Enum.TryParse<NivelAtividade>(nivel, true, out var niv))
                    query = query.Where(a => a.Nivel == niv);

                if (!string.IsNullOrWhiteSpace(etapa))
                    query = query.Where(a => a.EtapaMin == etapa || a.EtapaMax == etapa);

                if (ativo.HasValue)
                    query = query.Where(a => a.Ativo == ativo.Value);

                var atividades = await query
                    .OrderBy(a => a.Titulo)
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
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
                    .ToListAsync();

                resposta.AdicionaObjeto(atividades);
                resposta.Sucesso = true;
                return resposta;
            }
            catch (Exception)
            {
                resposta.SetFalha("Erro ao buscar atividades.");
                return resposta;
            }
        }

        // Buscar por ID (detalhes + preview)
        public async Task<ServiceResponse<AtividadeBuscarDTO>> GetAtividadePorId(int id)
        {
            var resposta = new ServiceResponse<AtividadeBuscarDTO>();

            try
            {
                var atividade = await _contexto.Atividades
                    .Include(a => a.Habilidades)
                    .Where(a => a.Id == id)
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
                    .FirstOrDefaultAsync();

                if (atividade == null)
                {
                    resposta.SetFalha($"Atividade com ID {id} não encontrada.");
                    return resposta;
                }

                resposta.AdicionaObjeto(atividade);
                resposta.Sucesso = true;
                resposta.AdicionaMensagem("Atividade encontrada com sucesso.");
                return resposta;
            }
            catch (Exception ex)
            {
                resposta.SetFalha("Erro ao buscar atividade: " + ex.Message);
                return resposta;
            }
        }

        // Cadastro
        public async Task<ServiceResponse<AtividadeCadastroDTO>> Cadastro(AtividadeCadastroDTO dto)
        {
            var resposta = new ServiceResponse<AtividadeCadastroDTO>();

            using (var transacao = await _contexto.Database.BeginTransactionAsync())
            {
                try
                {
                    if (!Enum.TryParse<NivelAtividade>(dto.Nivel, true, out var nivel))
                        throw new Exception("Nível inválido.");

                    var atividade = new Atividade
                    {
                        Titulo = dto.Titulo.Trim(),
                        Enunciado = dto.Enunciado.Trim(),
                        BlocoId = dto.BlocoId,
                        Nivel = nivel,
                        EtapaMin = dto.EtapaMin.Trim(),
                        EtapaMax = dto.EtapaMax?.Trim(),
                        Ativo = true,
                        ImagemUrl = dto.ImagemUrl?.Trim(), 
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    };

                    if (dto.ImagemUrl != null)
                        atividade.ImagemUrl = dto.ImagemUrl;

                    _contexto.Atividades.Add(atividade);
                    await _contexto.SaveChangesAsync();

                    // Sync habilidades se enviadas
                    if (dto.HabilidadeIds != null && dto.HabilidadeIds.Any())
                        await SyncHabilidades(atividade.Id, dto.HabilidadeIds);

                    await transacao.CommitAsync();

                    resposta.Sucesso = true;
                    resposta.AdicionaMensagem("Cadastro de atividade realizado com sucesso.");
                    return resposta;
                }
                catch (Exception ex)
                {
                    await transacao.RollbackAsync();
                    resposta.SetFalha("Erro ao cadastrar atividade: " + ex.Message);
                    return resposta;
                }
            }
        }

        // Atualizar
        public async Task<ServiceResponse<AtividadeAtualizarDTO>> Atualizar(int id, AtividadeAtualizarDTO dto)
        {
            var resposta = new ServiceResponse<AtividadeAtualizarDTO>();

            if (dto.Id != id)
            {
                resposta.SetFalha("ID do corpo da requisição diferente do ID da URL.");
                return resposta;
            }

            try
            {
                var atividade = await _contexto.Atividades
                    .Include(a => a.Habilidades)
                    .FirstOrDefaultAsync(a => a.Id == id);

                if (atividade == null)
                {
                    resposta.SetFalha($"Atividade com ID {id} não encontrada.");
                    return resposta;
                }

                if (!string.IsNullOrWhiteSpace(dto.Titulo))
                    atividade.Titulo = dto.Titulo.Trim();

                if (!string.IsNullOrWhiteSpace(dto.Enunciado))
                    atividade.Enunciado = dto.Enunciado.Trim();

                if (dto.BlocoId != 0)
                    atividade.BlocoId = dto.BlocoId;

                if (!string.IsNullOrWhiteSpace(dto.Nivel) && Enum.TryParse<NivelAtividade>(dto.Nivel, true, out var niv))
                    atividade.Nivel = niv;

                if (!string.IsNullOrWhiteSpace(dto.EtapaMin))
                    atividade.EtapaMin = dto.EtapaMin.Trim();

                if (dto.EtapaMax != null)
                    atividade.EtapaMax = dto.EtapaMax.Trim();

                if (dto.Ativo.HasValue)
                    atividade.Ativo = dto.Ativo.Value;

                if (dto.ImagemUrl != null)
                    atividade.ImagemUrl = dto.ImagemUrl.Trim();

                atividade.UpdatedAt = DateTime.UtcNow;

                // Sync habilidades se enviadas
                if (dto.HabilidadeIds != null)
                    await SyncHabilidades(id, dto.HabilidadeIds);

                await _contexto.SaveChangesAsync();

                resposta.Sucesso = true;
                resposta.AdicionaMensagem("Atividade atualizada com sucesso.");
                resposta.AdicionaObjeto(dto);
                return resposta;
            }
            catch (Exception ex)
            {
                resposta.SetFalha("Erro ao atualizar atividade: " + ex.Message);
                return resposta;
            }
        }

        // Excluir (soft delete)
        public async Task<ServiceResponse<bool>> Excluir(int id)
        {
            var resposta = new ServiceResponse<bool>();

            try
            {
                var atividade = await _contexto.Atividades.FirstOrDefaultAsync(a => a.Id == id);

                if (atividade == null)
                {
                    resposta.SetFalha($"Atividade com ID {id} não encontrada.");
                    return resposta;
                }

                atividade.Ativo = false;
                atividade.UpdatedAt = DateTime.UtcNow;

                await _contexto.SaveChangesAsync();

                resposta.Sucesso = true;
                resposta.AdicionaMensagem("Atividade excluída com sucesso (desativada).");
                resposta.AdicionaObjeto(true);
                return resposta;
            }
            catch (Exception ex)
            {
                resposta.SetFalha("Erro ao excluir atividade: " + ex.Message);
                return resposta;
            }
        }

        // Sync habilidades (endpoint separado ou chamado internamente)
        public async Task<ServiceResponse<bool>> SyncHabilidades(int atividadeId, List<int> habilidadeIds)
        {
            var resposta = new ServiceResponse<bool>();

            try
            {
                var atividade = await _contexto.Atividades
                    .Include(a => a.Habilidades)
                    .FirstOrDefaultAsync(a => a.Id == atividadeId);

                if (atividade == null)
                {
                    resposta.SetFalha($"Atividade com ID {atividadeId} não encontrada.");
                    return resposta;
                }

                // Remove antigas
                atividade.Habilidades.Clear();

                // Adiciona novas
                var habilidades = await _contexto.Habilidades
                    .Where(h => habilidadeIds.Contains(h.Id))
                    .ToListAsync();

                foreach (var hab in habilidades)
                    atividade.Habilidades.Add(hab);

                await _contexto.SaveChangesAsync();

                resposta.Sucesso = true;
                resposta.AdicionaMensagem("Habilidades sincronizadas com sucesso.");
                resposta.AdicionaObjeto(true);
                return resposta;
            }
            catch (Exception ex)
            {
                resposta.SetFalha("Erro ao sincronizar habilidades: " + ex.Message);
                return resposta;
            }
        }
    }
}