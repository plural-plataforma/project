using api.DTOs.DocumentoBiblioteca;
using api.Models;
using api.Responses;
using Data;
using Microsoft.EntityFrameworkCore;

namespace api.Services
{
    public class DocumentoBibliotecaService
    {
        private const long TamanhoMaximoBytes = 20 * 1024 * 1024; // 20MB
        private const string ExtensaoPermitida = ".docx";

        private readonly AppDbContext _contexto;

        public DocumentoBibliotecaService(AppDbContext contexto)
        {
            _contexto = contexto;
        }

        public async Task<ServiceResponse<List<DocumentoBibliotecaBuscarDTO>>> GetAll(
            string? busca = null, string? categoria = null, bool? ativo = null)
        {
            var resposta = new ServiceResponse<List<DocumentoBibliotecaBuscarDTO>>();

            try
            {
                var query = _contexto.DocumentosBiblioteca.AsQueryable();

                if (!string.IsNullOrWhiteSpace(busca))
                    query = query.Where(d => d.Nome.Contains(busca));

                if (!string.IsNullOrWhiteSpace(categoria))
                    query = query.Where(d => d.Categoria == categoria);

                query = ativo.HasValue
                    ? query.Where(d => d.Ativo == ativo.Value)
                    : query.Where(d => d.Ativo);

                var itens = await query
                    .OrderBy(d => d.Nome)
                    .Select(d => new DocumentoBibliotecaBuscarDTO
                    {
                        Id = d.Id,
                        Nome = d.Nome,
                        Categoria = d.Categoria,
                        NomeArquivoOriginal = d.NomeArquivoOriginal,
                        TamanhoBytes = d.TamanhoBytes,
                        Ativo = d.Ativo,
                        CreatedAt = d.CreatedAt,
                        UpdatedAt = d.UpdatedAt,
                    })
                    .ToListAsync();

                resposta.AdicionaObjeto(itens);
                resposta.Sucesso = true;
                return resposta;
            }
            catch (Exception ex)
            {
                resposta.SetFalha("Erro ao buscar documentos: " + ex.Message);
                return resposta;
            }
        }

        // Usado pelo endpoint de download — inclui o conteúdo binário.
        public async Task<ServiceResponse<DocumentoBiblioteca>> GetArquivoPorId(int id)
        {
            var resposta = new ServiceResponse<DocumentoBiblioteca>();

            var documento = await _contexto.DocumentosBiblioteca.FirstOrDefaultAsync(d => d.Id == id);
            if (documento == null)
            {
                resposta.SetFalha($"Documento com ID {id} não encontrado.");
                return resposta;
            }

            resposta.AdicionaObjeto(documento);
            resposta.Sucesso = true;
            return resposta;
        }

        public async Task<ServiceResponse<DocumentoBibliotecaBuscarDTO>> Cadastro(DocumentoBibliotecaCadastroDTO dto)
        {
            var resposta = new ServiceResponse<DocumentoBibliotecaBuscarDTO>();

            var erroArquivo = ValidarArquivo(dto.Arquivo);
            if (erroArquivo != null)
            {
                resposta.SetFalha(erroArquivo);
                return resposta;
            }

            try
            {
                using var stream = new MemoryStream();
                await dto.Arquivo.CopyToAsync(stream);

                var documento = new DocumentoBiblioteca
                {
                    Nome = dto.Nome.Trim(),
                    Categoria = string.IsNullOrWhiteSpace(dto.Categoria) ? null : dto.Categoria.Trim(),
                    NomeArquivoOriginal = dto.Arquivo.FileName,
                    ConteudoArquivo = stream.ToArray(),
                    TamanhoBytes = dto.Arquivo.Length,
                    Ativo = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                };

                _contexto.DocumentosBiblioteca.Add(documento);
                await _contexto.SaveChangesAsync();

                resposta.AdicionaObjeto(new DocumentoBibliotecaBuscarDTO
                {
                    Id = documento.Id,
                    Nome = documento.Nome,
                    Categoria = documento.Categoria,
                    NomeArquivoOriginal = documento.NomeArquivoOriginal,
                    TamanhoBytes = documento.TamanhoBytes,
                    Ativo = documento.Ativo,
                    CreatedAt = documento.CreatedAt,
                    UpdatedAt = documento.UpdatedAt,
                });
                resposta.Sucesso = true;
                resposta.AdicionaMensagem("Documento cadastrado com sucesso.");
                return resposta;
            }
            catch (Exception ex)
            {
                resposta.SetFalha("Erro ao cadastrar documento: " + ex.Message);
                return resposta;
            }
        }

        public async Task<ServiceResponse<DocumentoBibliotecaBuscarDTO>> Atualizar(int id, DocumentoBibliotecaAtualizarDTO dto)
        {
            var resposta = new ServiceResponse<DocumentoBibliotecaBuscarDTO>();

            try
            {
                var documento = await _contexto.DocumentosBiblioteca.FirstOrDefaultAsync(d => d.Id == id);
                if (documento == null)
                {
                    resposta.SetFalha($"Documento com ID {id} não encontrado.");
                    return resposta;
                }

                if (!string.IsNullOrWhiteSpace(dto.Nome))
                    documento.Nome = dto.Nome.Trim();

                if (dto.Categoria != null)
                    documento.Categoria = string.IsNullOrWhiteSpace(dto.Categoria) ? null : dto.Categoria.Trim();

                if (dto.Ativo.HasValue)
                    documento.Ativo = dto.Ativo.Value;

                if (dto.Arquivo != null)
                {
                    var erroArquivo = ValidarArquivo(dto.Arquivo);
                    if (erroArquivo != null)
                    {
                        resposta.SetFalha(erroArquivo);
                        return resposta;
                    }

                    using var stream = new MemoryStream();
                    await dto.Arquivo.CopyToAsync(stream);
                    documento.ConteudoArquivo = stream.ToArray();
                    documento.NomeArquivoOriginal = dto.Arquivo.FileName;
                    documento.TamanhoBytes = dto.Arquivo.Length;
                }

                documento.UpdatedAt = DateTime.UtcNow;
                await _contexto.SaveChangesAsync();

                resposta.AdicionaObjeto(new DocumentoBibliotecaBuscarDTO
                {
                    Id = documento.Id,
                    Nome = documento.Nome,
                    Categoria = documento.Categoria,
                    NomeArquivoOriginal = documento.NomeArquivoOriginal,
                    TamanhoBytes = documento.TamanhoBytes,
                    Ativo = documento.Ativo,
                    CreatedAt = documento.CreatedAt,
                    UpdatedAt = documento.UpdatedAt,
                });
                resposta.Sucesso = true;
                resposta.AdicionaMensagem("Documento atualizado com sucesso.");
                return resposta;
            }
            catch (Exception ex)
            {
                resposta.SetFalha("Erro ao atualizar documento: " + ex.Message);
                return resposta;
            }
        }

        // Soft delete — segue o mesmo padrão de AtividadeService.Excluir.
        public async Task<ServiceResponse<bool>> Excluir(int id)
        {
            var resposta = new ServiceResponse<bool>();

            try
            {
                var documento = await _contexto.DocumentosBiblioteca.FirstOrDefaultAsync(d => d.Id == id);
                if (documento == null)
                {
                    resposta.SetFalha($"Documento com ID {id} não encontrado.");
                    return resposta;
                }

                documento.Ativo = false;
                documento.UpdatedAt = DateTime.UtcNow;
                await _contexto.SaveChangesAsync();

                resposta.AdicionaObjeto(true);
                resposta.Sucesso = true;
                resposta.AdicionaMensagem("Documento excluído com sucesso (desativado).");
                return resposta;
            }
            catch (Exception ex)
            {
                resposta.SetFalha("Erro ao excluir documento: " + ex.Message);
                return resposta;
            }
        }

        private static string? ValidarArquivo(Microsoft.AspNetCore.Http.IFormFile arquivo)
        {
            if (arquivo == null || arquivo.Length == 0)
                return "Selecione um arquivo para enviar.";

            if (arquivo.Length > TamanhoMaximoBytes)
                return "Arquivo maior que o limite permitido (20MB).";

            var extensao = Path.GetExtension(arquivo.FileName);
            if (!string.Equals(extensao, ExtensaoPermitida, StringComparison.OrdinalIgnoreCase))
                return "Apenas arquivos .docx são aceitos.";

            return null;
        }
    }
}
