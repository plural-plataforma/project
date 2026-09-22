namespace api.DTOs.Admin
{
    public class UsoIADTO
    {
        public DateTime? PeriodoInicio { get; set; }
        public DateTime? PeriodoFim { get; set; }

        // Tentativas que chamaram a IA (sucesso + falha). Bloqueios por limite ficam à parte.
        public int TotalGeracoes { get; set; }
        public int TotalSucesso { get; set; }
        public int TotalFalha { get; set; }
        public int TotalBloqueiosLimite { get; set; }
        public decimal CustoEstimadoReais { get; set; }

        public int TotalProfessoras { get; set; }
        public int ProfessorasAtivasNoPeriodo { get; set; }
        public int ProfessorasSemUsoNunca { get; set; }
        public int ProfessorasComBloqueioNoPeriodo { get; set; }

        public double MediaGeracoesPorProfessoraAtiva { get; set; }
        public int MedianaGeracoesPorProfessoraAtiva { get; set; }
        public int Percentil90GeracoesPorProfessoraAtiva { get; set; }

        // Limites vigentes e mês corrente (horário de Brasília), independente do período filtrado.
        public int LimiteDiario { get; set; }
        public int LimiteMensal { get; set; }
        public int ProfessorasNoLimiteMensalMesAtual { get; set; }

        public List<UsoIAPorTipoDTO> PorTipoDocumento { get; set; } = new();
        public List<UsoIAFaixaUsoDTO> FaixasUso { get; set; } = new();
        public List<UsoIAPorDiaDTO> PorDia { get; set; } = new();
        public List<UsoIAPorHoraDTO> PorHora { get; set; } = new();
        public List<UsoIAPorProfessoraDTO> PorProfessora { get; set; } = new();
    }

    public class UsoIAPorTipoDTO
    {
        public string TipoDocumento { get; set; } = string.Empty;
        public int Total { get; set; }
        public int Sucesso { get; set; }
        public int ProfessorasDistintas { get; set; }
    }

    public class UsoIAFaixaUsoDTO
    {
        public string Faixa { get; set; } = string.Empty;
        public int Professoras { get; set; }
    }

    public class UsoIAPorDiaDTO
    {
        public DateOnly Data { get; set; }
        public int Total { get; set; }
        public int Sucesso { get; set; }
        public int Falha { get; set; }
        public int BloqueiosLimite { get; set; }
        public int ProfessorasDistintas { get; set; }
    }

    public class UsoIAPorHoraDTO
    {
        public int Hora { get; set; }
        public int Total { get; set; }
    }

    public class UsoIAPorProfessoraDTO
    {
        public int ProfessorId { get; set; }
        public string NomeCompleto { get; set; } = string.Empty;
        public int Total { get; set; }
        public int Sucesso { get; set; }
        public int EstudoCaso { get; set; }
        public int Paee { get; set; }
        public int AvaliacaoDiagnostica { get; set; }
        public int RelatoAtendimento { get; set; }
        public int RelatorioPedagogico { get; set; }
        public int RelatorioTextoFinal { get; set; }
        public int BloqueiosLimite { get; set; }
        public int DiasAtivos { get; set; }
        public int MaximoEmUmDia { get; set; }
        public int AlunosDistintos { get; set; }
        public int UsoMesAtual { get; set; }
        public bool LimiteMensalAtingido { get; set; }
        public DateTime? PrimeiraGeracao { get; set; }
        public DateTime? UltimaGeracao { get; set; }
    }
}
