using api.DTOs.Admin;
using api.Models;
using api.Responses;
using Data;
using Microsoft.EntityFrameworkCore;
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

        public async Task<ServiceResponse<UsoIADTO>> GetUsoIAAsync(DateTime? from, DateTime? to)
        {
            var resposta = new ServiceResponse<UsoIADTO>();
            try
            {
                var query = _db.GeracoesIALog.AsNoTracking().AsQueryable();
                if (from.HasValue) query = query.Where(g => g.CriadoEm >= from.Value);
                if (to.HasValue) query = query.Where(g => g.CriadoEm <= to.Value);

                var registros = await query.ToListAsync();

                var porTipo = registros
                    .GroupBy(r => r.TipoDocumento)
                    .Select(g => new UsoIAPorTipoDTO
                    {
                        TipoDocumento = RotuloTipo(g.Key),
                        Total = g.Count(),
                        Sucesso = g.Count(r => r.Sucesso),
                    })
                    .OrderByDescending(t => t.Total)
                    .ToList();

                var professores = await _db.Professores.AsNoTracking()
                    .Select(p => new { p.ID, p.NomeCompleto })
                    .ToListAsync();

                var porProfessoraLookup = registros
                    .GroupBy(r => r.ProfessorId)
                    .ToDictionary(g => g.Key, g => g.ToList());

                var porProfessora = professores
                    .Where(p => porProfessoraLookup.ContainsKey(p.ID))
                    .Select(p =>
                    {
                        var itens = porProfessoraLookup[p.ID];
                        return new UsoIAPorProfessoraDTO
                        {
                            ProfessorId = p.ID,
                            NomeCompleto = p.NomeCompleto ?? "",
                            Total = itens.Count,
                            Sucesso = itens.Count(i => i.Sucesso),
                            EstudoCaso = itens.Count(i => i.TipoDocumento == TipoDocumentoIA.EstudoCaso),
                            Paee = itens.Count(i => i.TipoDocumento == TipoDocumentoIA.PAEE),
                            AvaliacaoDiagnostica = itens.Count(i => i.TipoDocumento == TipoDocumentoIA.AvaliacaoDiagnostica),
                            RelatoAtendimento = itens.Count(i => i.TipoDocumento == TipoDocumentoIA.RelatoAtendimento),
                            UltimaGeracao = itens.Max(i => i.CriadoEm),
                        };
                    })
                    .OrderByDescending(p => p.Total)
                    .ToList();

                // "Nunca usou" é sempre all-time, independente do filtro de período escolhido.
                var idsComUsoAlgumaVez = await _db.GeracoesIALog.AsNoTracking()
                    .Select(g => g.ProfessorId)
                    .Distinct()
                    .ToListAsync();
                var professorasSemUsoNunca = professores.Count(p => !idsComUsoAlgumaVez.Contains(p.ID));

                resposta.AdicionaObjeto(new UsoIADTO
                {
                    PeriodoInicio = from,
                    PeriodoFim = to,
                    TotalGeracoes = registros.Count,
                    TotalSucesso = registros.Count(r => r.Sucesso),
                    TotalFalha = registros.Count(r => !r.Sucesso),
                    TotalProfessoras = professores.Count,
                    ProfessorasAtivasNoPeriodo = porProfessoraLookup.Count,
                    ProfessorasSemUsoNunca = professorasSemUsoNunca,
                    PorTipoDocumento = porTipo,
                    PorProfessora = porProfessora,
                });
                resposta.Sucesso = true;
                return resposta;
            }
            catch (Exception ex)
            {
                resposta.SetFalha("Erro ao gerar relatório de uso de IA: " + ex.Message);
                return resposta;
            }
        }

        private static string RotuloTipo(TipoDocumentoIA tipo) => tipo switch
        {
            TipoDocumentoIA.EstudoCaso => "Estudo de Caso",
            TipoDocumentoIA.PAEE => "PAEE",
            TipoDocumentoIA.AvaliacaoDiagnostica => "Avaliação Diagnóstica",
            TipoDocumentoIA.RelatoAtendimento => "Relato de Atendimento",
            _ => tipo.ToString(),
        };
    }
}
