using api.Models;

namespace api.DTOs.Relatorio;

public class RelatorioSecaoDTO
{
    public RelatorioSecaoChave SecaoChave { get; set; }

    public string? TextoGerado { get; set; }

    public string? TextoEditado { get; set; }

    public string? NotasManuais { get; set; }

    public DateTime? GeradoEm { get; set; }

    public DateTime? EditadoEm { get; set; }

    // Ajuda o frontend a destacar a seção sem precisar reimplementar a regra.
    public bool InformacaoInsuficiente => string.IsNullOrWhiteSpace(TextoGerado) && string.IsNullOrWhiteSpace(TextoEditado);
}
