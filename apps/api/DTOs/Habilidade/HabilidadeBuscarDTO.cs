namespace api.DTOs.Habilidade
{

    public class HabilidadeBuscarDTO
    {
        public int Id { get; set; }

        public int IdNivelEnsino { get; set; }

        public string Tipo { get; set; }

        public string Descricao { get; set; }

        public string Resumo { get; set; }

        public bool Ativo { get; set; }
    }
    
}
