namespace api.DTOs.Aluno
{
    public class AlunoBuscarDTO
    {
         public int Id { get; set; }

        public string NomeCompleto { get; set; }

        public string? Cep { get; set; }

        public string? Logradouro { get; set; }

        public int? Numero { get; set; }

        public string? Complemento { get; set; }

        public string? Bairro { get; set; }

        public string? Estado { get; set; }

        public string? Cidade { get; set; }

        public int? Telefone { get; set; }

        public int IdEscola { get; set; }

        public string? NivelEnsino { get; set; }

        public string? Ano { get; set; }

        public string? Turno { get; set; }
    }
}
