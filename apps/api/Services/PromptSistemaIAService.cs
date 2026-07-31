using api.DTOs.PromptSistemaIA;
using api.Models;
using api.Responses;
using Data;
using Microsoft.EntityFrameworkCore;

namespace api.Services
{
    public class PromptSistemaIAService
    {
        private readonly AppDbContext _contexto;

        public PromptSistemaIAService(AppDbContext contexto)
        {
            _contexto = contexto;
        }

        public async Task<ServiceResponse<List<PromptSistemaIABuscarDTO>>> ListarAsync()
        {
            var resposta = new ServiceResponse<List<PromptSistemaIABuscarDTO>>();
            try
            {
                var itens = await _contexto.PromptsSistemaIA
                    .OrderBy(p => p.TipoDocumento)
                    .Select(p => new PromptSistemaIABuscarDTO
                    {
                        Id = p.Id,
                        TipoDocumento = p.TipoDocumento.ToString(),
                        Conteudo = p.Conteudo,
                        UpdatedAt = p.UpdatedAt,
                    })
                    .ToListAsync();

                resposta.AdicionaObjeto(itens);
                resposta.Sucesso = true;
                return resposta;
            }
            catch (Exception ex)
            {
                resposta.SetFalha("Erro ao listar prompts de IA: " + ex.Message);
                return resposta;
            }
        }

        public async Task<ServiceResponse<PromptSistemaIABuscarDTO>> AtualizarAsync(TipoDocumentoIA tipo, PromptSistemaIAAtualizarDTO dto)
        {
            var resposta = new ServiceResponse<PromptSistemaIABuscarDTO>();

            if (string.IsNullOrWhiteSpace(dto.Conteudo))
            {
                resposta.SetFalha("O conteúdo do prompt não pode ser vazio.");
                return resposta;
            }

            try
            {
                var entidade = await _contexto.PromptsSistemaIA.FirstOrDefaultAsync(p => p.TipoDocumento == tipo);
                if (entidade == null)
                {
                    resposta.SetFalha($"Prompt do tipo {tipo} não encontrado.");
                    return resposta;
                }

                entidade.Conteudo = dto.Conteudo.Trim();
                entidade.UpdatedAt = DateTime.UtcNow;
                await _contexto.SaveChangesAsync();

                resposta.AdicionaObjeto(new PromptSistemaIABuscarDTO
                {
                    Id = entidade.Id,
                    TipoDocumento = entidade.TipoDocumento.ToString(),
                    Conteudo = entidade.Conteudo,
                    UpdatedAt = entidade.UpdatedAt,
                });
                resposta.Sucesso = true;
                resposta.AdicionaMensagem("Prompt atualizado com sucesso.");
                return resposta;
            }
            catch (Exception ex)
            {
                resposta.SetFalha("Erro ao atualizar prompt de IA: " + ex.Message);
                return resposta;
            }
        }

        // Uso interno por outros services (ex.: EstudoDeCasoService) — sem envelope ServiceResponse.
        public async Task<string?> BuscarConteudoAtivoAsync(TipoDocumentoIA tipo)
        {
            var entidade = await _contexto.PromptsSistemaIA
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.TipoDocumento == tipo);
            return entidade?.Conteudo;
        }
    }
}
