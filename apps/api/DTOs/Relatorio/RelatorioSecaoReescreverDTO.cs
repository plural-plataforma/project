using System.ComponentModel.DataAnnotations;
using api.Models;

namespace api.DTOs.Relatorio;

// Reescrita de uma seção pela IA incorporando as notas manuais. O texto e as notas vêm do
// corpo da requisição, não do banco, porque a professora dispara a reescrita a partir do
// rascunho em tela — nada é persistido até ela aceitar a sugestão e salvar a seção.
public class RelatorioSecaoReescreverDTO
{
    [Required]
    public RelatorioSecaoChave SecaoChave { get; set; }

    public string? TextoAtual { get; set; }

    [Required(ErrorMessage = "Escreva uma nota manual para a IA incorporar ao texto.")]
    public string NotasManuais { get; set; } = string.Empty;
}
