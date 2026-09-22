using api.DTOs.Admin;
using api.Models;
using api.Responses;
using Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace api.Services
{
    // Registra cada tentativa de geração de texto por IA (inclusive as recusadas pelo limite
    // diário) — base da contagem do LimiteUsoIAService e do painel admin de uso de IA.
    // Nunca deve derrubar o fluxo principal de geração.
    public class GeracaoIALogService
    {
        private readonly AppDbContext _db;
        private readonly ILogger<GeracaoIALogService> _logger;

        public GeracaoIALogService(AppDbContext db, ILogger<GeracaoIALogService> logger)
        {
            _db = db;
            _logger = logger;
        }

        // Estimativa com o modelo atual (Gemini Flash), levantada no estudo que definiu os limites
        // de uso — serve só de ordem de grandeza no painel admin, não é valor faturado.
        private const decimal CustoEstimadoPorGeracaoReais = 0.02m;

        private static readonly (string Rotulo, int Minimo, int Maximo)[] FaixasUso =
        [
            ("1 a 5", 1, 5),
            ("6 a 20", 6, 20),
            ($"21 a {LimiteUsoIAService.LimiteMensal}", 21, LimiteUsoIAService.LimiteMensal),
            ($"Acima de {LimiteUsoIAService.LimiteMensal}", LimiteUsoIAService.LimiteMensal + 1, int.MaxValue),
        ];

        public async Task RegistrarAsync(
            int professorId,
            TipoDocumentoIA tipoDocumento,
            int documentoId,
            int? alunoId,
            bool sucesso,
            bool bloqueadoPorLimite = false)
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
                    BloqueadoPorLimite = bloqueadoPorLimite,
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

                var registrosPeriodo = await query.ToListAsync();
                var registros = registrosPeriodo.Where(r => !r.BloqueadoPorLimite).ToList();
                var bloqueios = registrosPeriodo.Where(r => r.BloqueadoPorLimite).ToList();

                var porTipo = registros
                    .GroupBy(r => r.TipoDocumento)
                    .Select(g => new UsoIAPorTipoDTO
                    {
                        TipoDocumento = RotuloTipo(g.Key),
                        Total = g.Count(),
                        Sucesso = g.Count(r => r.Sucesso),
                        ProfessorasDistintas = g.Select(r => r.ProfessorId).Distinct().Count(),
                    })
                    .OrderByDescending(t => t.Total)
                    .ToList();

                var professores = await _db.Professores.AsNoTracking()
                    .Select(p => new { p.ID, p.NomeCompleto })
                    .ToListAsync();

                var (_, inicioMesUtc) = LimiteUsoIAService.CalcularInicioPeriodosUtc(DateTime.UtcNow);
                var usoMesAtualPorProfessora = await _db.GeracoesIALog.AsNoTracking()
                    .Where(g => g.Sucesso && g.CriadoEm >= inicioMesUtc)
                    .GroupBy(g => g.ProfessorId)
                    .Select(g => new { ProfessorId = g.Key, Total = g.Count() })
                    .ToDictionaryAsync(g => g.ProfessorId, g => g.Total);

                var porProfessoraLookup = registros
                    .GroupBy(r => r.ProfessorId)
                    .ToDictionary(g => g.Key, g => g.ToList());
                var bloqueiosPorProfessora = bloqueios
                    .GroupBy(r => r.ProfessorId)
                    .ToDictionary(g => g.Key, g => g.Count());

                var porProfessora = professores
                    .Where(p => porProfessoraLookup.ContainsKey(p.ID) || bloqueiosPorProfessora.ContainsKey(p.ID))
                    .Select(p =>
                    {
                        var itens = porProfessoraLookup.GetValueOrDefault(p.ID) ?? [];
                        var usoMesAtual = usoMesAtualPorProfessora.GetValueOrDefault(p.ID);
                        var porDiaBrasilia = itens
                            .GroupBy(i => DateOnly.FromDateTime(LimiteUsoIAService.ParaHorarioBrasilia(i.CriadoEm)))
                            .Select(g => g.Count())
                            .ToList();

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
                            RelatorioPedagogico = itens.Count(i => i.TipoDocumento == TipoDocumentoIA.RelatorioPedagogico),
                            RelatorioTextoFinal = itens.Count(i => i.TipoDocumento == TipoDocumentoIA.RelatorioTextoFinal),
                            BloqueiosLimite = bloqueiosPorProfessora.GetValueOrDefault(p.ID),
                            DiasAtivos = porDiaBrasilia.Count,
                            MaximoEmUmDia = porDiaBrasilia.DefaultIfEmpty(0).Max(),
                            AlunosDistintos = itens.Where(i => i.AlunoId.HasValue).Select(i => i.AlunoId).Distinct().Count(),
                            UsoMesAtual = usoMesAtual,
                            LimiteMensalAtingido = usoMesAtual >= LimiteUsoIAService.LimiteMensal,
                            PrimeiraGeracao = itens.Count > 0 ? itens.Min(i => i.CriadoEm) : null,
                            UltimaGeracao = itens.Count > 0 ? itens.Max(i => i.CriadoEm) : null,
                        };
                    })
                    .OrderByDescending(p => p.Total)
                    .ToList();

                var totaisPorProfessoraAtiva = porProfessora
                    .Where(p => p.Total > 0)
                    .Select(p => p.Total)
                    .OrderBy(t => t)
                    .ToList();

                var faixasUso = FaixasUso
                    .Select(f => new UsoIAFaixaUsoDTO
                    {
                        Faixa = f.Rotulo,
                        Professoras = totaisPorProfessoraAtiva.Count(t => t >= f.Minimo && t <= f.Maximo),
                    })
                    .ToList();

                var porHora = Enumerable.Range(0, 24)
                    .Select(hora => new UsoIAPorHoraDTO
                    {
                        Hora = hora,
                        Total = registros.Count(r => LimiteUsoIAService.ParaHorarioBrasilia(r.CriadoEm).Hour == hora),
                    })
                    .ToList();

                // "Nunca usou" é sempre all-time, independente do filtro de período escolhido.
                var idsComUsoAlgumaVez = await _db.GeracoesIALog.AsNoTracking()
                    .Where(g => !g.BloqueadoPorLimite)
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
                    TotalBloqueiosLimite = bloqueios.Count,
                    CustoEstimadoReais = registros.Count * CustoEstimadoPorGeracaoReais,
                    TotalProfessoras = professores.Count,
                    ProfessorasAtivasNoPeriodo = porProfessoraLookup.Count,
                    ProfessorasSemUsoNunca = professorasSemUsoNunca,
                    ProfessorasComBloqueioNoPeriodo = bloqueiosPorProfessora.Count,
                    MediaGeracoesPorProfessoraAtiva = totaisPorProfessoraAtiva.Count > 0
                        ? Math.Round(totaisPorProfessoraAtiva.Average(), 1)
                        : 0,
                    MedianaGeracoesPorProfessoraAtiva = Percentil(totaisPorProfessoraAtiva, 0.5),
                    Percentil90GeracoesPorProfessoraAtiva = Percentil(totaisPorProfessoraAtiva, 0.9),
                    LimiteDiario = LimiteUsoIAService.LimiteDiario,
                    LimiteMensal = LimiteUsoIAService.LimiteMensal,
                    ProfessorasNoLimiteMensalMesAtual = usoMesAtualPorProfessora.Values
                        .Count(total => total >= LimiteUsoIAService.LimiteMensal),
                    PorTipoDocumento = porTipo,
                    FaixasUso = faixasUso,
                    PorDia = MontarPorDia(registrosPeriodo, from, to),
                    PorHora = porHora,
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

        // Série diária no horário de Brasília, com dias sem geração zerados quando o período é
        // fechado (pro gráfico não "pular" dias).
        private static List<UsoIAPorDiaDTO> MontarPorDia(List<GeracaoIALog> registrosPeriodo, DateTime? from, DateTime? to)
        {
            var porData = registrosPeriodo
                .GroupBy(r => DateOnly.FromDateTime(LimiteUsoIAService.ParaHorarioBrasilia(r.CriadoEm)))
                .ToDictionary(g => g.Key, g => g.ToList());

            IEnumerable<DateOnly> datas = porData.Keys.OrderBy(d => d);
            if (from.HasValue && to.HasValue)
            {
                var inicio = DateOnly.FromDateTime(LimiteUsoIAService.ParaHorarioBrasilia(from.Value.ToUniversalTime()));
                var fim = DateOnly.FromDateTime(LimiteUsoIAService.ParaHorarioBrasilia(to.Value.ToUniversalTime()));
                datas = Enumerable.Range(0, Math.Max(0, fim.DayNumber - inicio.DayNumber + 1))
                    .Select(inicio.AddDays);
            }

            return datas
                .Select(data =>
                {
                    var itens = porData.GetValueOrDefault(data) ?? [];
                    var tentativas = itens.Where(i => !i.BloqueadoPorLimite).ToList();
                    return new UsoIAPorDiaDTO
                    {
                        Data = data,
                        Total = tentativas.Count,
                        Sucesso = tentativas.Count(i => i.Sucesso),
                        Falha = tentativas.Count(i => !i.Sucesso),
                        BloqueiosLimite = itens.Count(i => i.BloqueadoPorLimite),
                        ProfessorasDistintas = tentativas.Select(i => i.ProfessorId).Distinct().Count(),
                    };
                })
                .ToList();
        }

        private static int Percentil(List<int> valoresOrdenados, double percentil)
        {
            if (valoresOrdenados.Count == 0) return 0;
            var indice = (int)Math.Ceiling(percentil * valoresOrdenados.Count) - 1;
            return valoresOrdenados[Math.Clamp(indice, 0, valoresOrdenados.Count - 1)];
        }

        private static string RotuloTipo(TipoDocumentoIA tipo) => tipo switch
        {
            TipoDocumentoIA.EstudoCaso => "Estudo de Caso",
            TipoDocumentoIA.PAEE => "PAEE",
            TipoDocumentoIA.AvaliacaoDiagnostica => "Avaliação Diagnóstica",
            TipoDocumentoIA.RelatoAtendimento => "Relato de Atendimento",
            TipoDocumentoIA.RelatorioPedagogico => "Relatório Pedagógico",
            TipoDocumentoIA.RelatorioTextoFinal => "Revisão final do Relatório",
            _ => tipo.ToString(),
        };
    }
}
