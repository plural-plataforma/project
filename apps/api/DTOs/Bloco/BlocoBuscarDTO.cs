namespace api.DTOs.Bloco
{
    public class BlocoBuscarDTO
    {
        public int Id { get; set; }
        public string Titulo { get; set; } = string.Empty;
        public int Ordem { get; set; }
        public string? Observacao { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public bool Status { get; set; }
        public string? Icone { get; set; }
        public int QuantidadeAtividades { get; set; }
    }
}
