namespace api.DTOs.DocumentoBiblioteca
{
    // Metadados apenas — sem o conteúdo binário do arquivo (evita payload pesado na listagem).
    public class DocumentoBibliotecaBuscarDTO
    {
        public int Id { get; set; }
        public string Nome { get; set; } = string.Empty;
        public string? Categoria { get; set; }
        public string NomeArquivoOriginal { get; set; } = string.Empty;
        public long TamanhoBytes { get; set; }
        public bool Ativo { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}
