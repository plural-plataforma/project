namespace api.DTOs.Admin
{
    public class ResumoPedagogicoDTO
    {
        public DateTime? PeriodoInicio { get; set; }
        public DateTime? PeriodoFim { get; set; }

        public int AvaliacoesCriadas { get; set; }
        public int AvaliacoesConcluidas { get; set; }

        public int DesempenhosRegistrados { get; set; }
        public List<NivelRealizacaoContagemDTO> DesempenhosPorNivel { get; set; } = new();

        public int DiagnosticosFinaisGerados { get; set; }
    }

    public class NivelRealizacaoContagemDTO
    {
        public string Nivel { get; set; } = string.Empty;
        public int Quantidade { get; set; }
    }
}
