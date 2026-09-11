using api.Models;

namespace api.DTOs.Relatorio;

// Sugestão de texto da IA para uma seção — devolvida sem ser gravada, pra professora
// comparar com o texto atual antes de aceitar.
public class RelatorioSecaoReescritaDTO
{
    public RelatorioSecaoChave SecaoChave { get; set; }

    public string TextoSugerido { get; set; } = string.Empty;
}
