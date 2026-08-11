using api.Models;
using Data;
using Microsoft.Extensions.Logging;

namespace api.Services
{
    // Registra cada tentativa de geração de texto por IA, pra levantar dado real de uso por
    // professora (quem usa muito, quem nunca usou, distribuição por tipo de documento) antes
    // de decidir número de limite. Nunca deve derrubar o fluxo principal de geração.
    public class GeracaoIALogService
    {
        private readonly AppDbContext _db;
        private readonly ILogger<GeracaoIALogService> _logger;

        public GeracaoIALogService(AppDbContext db, ILogger<GeracaoIALogService> logger)
        {
            _db = db;
            _logger = logger;
        }

        public async Task RegistrarAsync(
            int professorId,
            TipoDocumentoIA tipoDocumento,
            int documentoId,
            int? alunoId,
            bool sucesso)
        {
            try
            {
                _db.GeracoesIALog.Add(new GeracaoIALog
                {
                    ProfessorId = professorId,
                    TipoDocumento = tipoDocumento,
                    DocumentoId = documentoId,
                    AlunoId = alunoId,
                    Sucesso = sucesso,
                });
                await _db.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Falha ao registrar log de geração IA (tipo {Tipo}, documento {DocumentoId})",
                    tipoDocumento, documentoId);
            }
        }
    }
}
