using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http;

namespace api.DTOs.DocumentoBiblioteca
{
    public class DocumentoBibliotecaCadastroDTO
    {
        [Required]
        [MaxLength(200)]
        public string Nome { get; set; } = string.Empty;

        [MaxLength(100)]
        public string? Categoria { get; set; }

        [Required]
        public IFormFile Arquivo { get; set; } = null!;
    }
}
