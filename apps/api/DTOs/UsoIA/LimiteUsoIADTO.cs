namespace api.DTOs.UsoIA
{
    public class LimiteUsoIADTO
    {
        public int UsoHoje { get; set; }
        public int LimiteDiario { get; set; }
        public bool LimiteDiarioAtingido { get; set; }

        public int UsoMes { get; set; }
        public int LimiteMensal { get; set; }
        public bool LimiteMensalAtingido { get; set; }
    }
}
