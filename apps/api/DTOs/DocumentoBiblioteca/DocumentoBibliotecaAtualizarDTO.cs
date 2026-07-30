using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http;

namespace api.DTOs.DocumentoBiblioteca
{
    public class DocumentoBibliotecaAtualizarDTO
    {
        [MaxLength(200)]
        public string? Nome { get; set; }

        [MaxLength(100)]
        public string? Categoria { get; set; }

        public bool? Ativo { get; set; }

        // Opcional — se enviado, substitui o arquivo atual.
        public IFormFile? Arquivo { get; set; }
    }
}
