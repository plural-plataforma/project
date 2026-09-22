namespace api.DTOs.Admin
{
    public class EstatisticasUsuariosDTO
    {
        public int TotalUsuarios { get; set; }
        public int TotalAtivos { get; set; }
        public int TotalEmbaixadoras { get; set; }
        public int TotalSemExpiracao { get; set; }
        public int TotalBloqueados { get; set; }
        public int TotalExpirados { get; set; }

        public List<DistribuicaoItemDTO> DistribuicaoPorNivelEnsino { get; set; } = new();
        public List<DistribuicaoItemDTO> DistribuicaoPorStatus { get; set; } = new();
    }

    public class DistribuicaoItemDTO
    {
        public string Chave { get; set; } = string.Empty;
        public int Valor { get; set; }
    }
}
