using System.ComponentModel.DataAnnotations;
using api.Models;

namespace api.DTOs.Relatorio;

public class RelatorioSecaoAtualizarDTO
{
    [Required]
    public RelatorioSecaoChave SecaoChave { get; set; }

    public string? TextoEditado { get; set; }

    public string? NotasManuais { get; set; }
}
