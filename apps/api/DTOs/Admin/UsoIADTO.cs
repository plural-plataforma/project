namespace api.DTOs.Admin
{
    public class UsoIADTO
    {
        public DateTime? PeriodoInicio { get; set; }
        public DateTime? PeriodoFim { get; set; }

        public int TotalGeracoes { get; set; }
        public int TotalSucesso { get; set; }
        public int TotalFalha { get; set; }

        public int TotalProfessoras { get; set; }
        public int ProfessorasAtivasNoPeriodo { get; set; }
        public int ProfessorasSemUsoNunca { get; set; }

        public List<UsoIAPorTipoDTO> PorTipoDocumento { get; set; } = new();
        public List<UsoIAPorProfessoraDTO> PorProfessora { get; set; } = new();
    }

    public class UsoIAPorTipoDTO
    {
        public string TipoDocumento { get; set; } = string.Empty;
        public int Total { get; set; }
        public int Sucesso { get; set; }
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
        public DateTime? UltimaGeracao { get; set; }
    }
}
