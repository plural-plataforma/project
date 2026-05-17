using System.ComponentModel.DataAnnotations;

namespace api.DTOs.Laudo
{
    public class LaudoCadastroSimplificadoDTO
    {
        public string? CodigoCid { get; set; }

        [MaxLength(256)]
        public string? NomeMedico { get; set; }

        [MaxLength(2000)]
        public string? Descricao { get; set; }
    }
}