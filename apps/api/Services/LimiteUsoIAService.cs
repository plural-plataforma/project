using api.DTOs.UsoIA;
using api.Models;
using api.Responses;
using Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace api.Services
{
    // Limite de uso de IA por professora, contando só gerações com sucesso de todos os tipos:
    // - diário (anti-abuso/automação): bloqueia a geração ao atingir o teto;
    // - mensal ("soft"): só sinaliza pro front avisar e pro admin revisar, nunca bloqueia.
    // Dia e mês seguem o horário de Brasília — CriadoEm é gravado em UTC.
    public class LimiteUsoIAService
    {
        public const int LimiteDiario = 20;
        public const int LimiteMensal = 50;

        private static readonly TimeZoneInfo FusoBrasilia = TimeZoneInfo.FindSystemTimeZoneById("America/Sao_Paulo");

        private readonly AppDbContext _db;
        private readonly GeracaoIALogService _geracaoLog;
        private readonly ILogger<LimiteUsoIAService> _logger;

        public LimiteUsoIAService(AppDbContext db, GeracaoIALogService geracaoLog, ILogger<LimiteUsoIAService> logger)
        {
            _db = db;
            _geracaoLog = geracaoLog;
            _logger = logger;
        }

        public static (DateTime InicioDiaUtc, DateTime InicioMesUtc) CalcularInicioPeriodosUtc(DateTime agoraUtc)
        {
            var agoraBrasilia = ParaHorarioBrasilia(agoraUtc);
            var inicioDia = DateTime.SpecifyKind(agoraBrasilia.Date, DateTimeKind.Unspecified);
            var inicioMes = new DateTime(agoraBrasilia.Year, agoraBrasilia.Month, 1, 0, 0, 0, DateTimeKind.Unspecified);

            return (
                TimeZoneInfo.ConvertTimeToUtc(inicioDia, FusoBrasilia),
                TimeZoneInfo.ConvertTimeToUtc(inicioMes, FusoBrasilia));
        }

        public static DateTime ParaHorarioBrasilia(DateTime utc) =>
            TimeZoneInfo.ConvertTimeFromUtc(DateTime.SpecifyKind(utc, DateTimeKind.Utc), FusoBrasilia);

        public async Task<ServiceResponse<LimiteUsoIADTO>> ObterUsoAsync(int professorId)
        {
            var resposta = new ServiceResponse<LimiteUsoIADTO>();
            if (professorId == 0)
            {
                resposta.SetFalha("Professor não identificado.");
                return resposta;
            }

            try
            {
                resposta.AdicionaObjeto(await CalcularUsoAsync(professorId));
                return resposta;
            }
            catch (Exception ex)
            {
                resposta.SetFalha("Erro ao consultar uso de IA: " + ex.Message);
                return resposta;
            }
        }

        // Retorna a mensagem de bloqueio quando o limite diário já foi atingido (e registra a
        // tentativa recusada no log), ou null quando a geração pode seguir. Chamar logo antes de
        // acionar a IA / enfileirar a geração, depois das validações de negócio do fluxo.
        // Duas requisições simultâneas no limiar podem passar juntas e falha na contagem libera a
        // geração — aceitável pra um limite anti-abuso, que não deve derrubar o uso normal.
        public async Task<string?> VerificarLimiteDiarioAsync(
            int professorId,
            TipoDocumentoIA tipoDocumento,
            int documentoId,
            int? alunoId)
        {
            LimiteUsoIADTO uso;
            try
            {
                uso = await CalcularUsoAsync(professorId);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Falha ao verificar limite diário de IA (professor {ProfessorId})", professorId);
                return null;
            }

            if (!uso.LimiteDiarioAtingido) return null;

            await _geracaoLog.RegistrarAsync(professorId, tipoDocumento, documentoId, alunoId,
                sucesso: false, bloqueadoPorLimite: true);

            return $"Você atingiu o limite de {LimiteDiario} gerações com IA por dia. Tente novamente amanhã.";
        }

        private async Task<LimiteUsoIADTO> CalcularUsoAsync(int professorId)
        {
            var (inicioDiaUtc, inicioMesUtc) = CalcularInicioPeriodosUtc(DateTime.UtcNow);

            var sucessosNoMes = _db.GeracoesIALog.AsNoTracking()
                .Where(g => g.ProfessorId == professorId && g.Sucesso && g.CriadoEm >= inicioMesUtc);

            var usoMes = await sucessosNoMes.CountAsync();
            var usoHoje = await sucessosNoMes.CountAsync(g => g.CriadoEm >= inicioDiaUtc);

            return new LimiteUsoIADTO
            {
                UsoHoje = usoHoje,
                LimiteDiario = LimiteDiario,
                LimiteDiarioAtingido = usoHoje >= LimiteDiario,
                UsoMes = usoMes,
                LimiteMensal = LimiteMensal,
                LimiteMensalAtingido = usoMes >= LimiteMensal,
            };
        }
    }
}
