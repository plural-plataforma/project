namespace api.Models;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

[Table("configuracoes_site")]
public class ConfiguracaoSite
{
    [Key]
    [MaxLength(100)]
    public string Chave { get; set; } = string.Empty;

    public string Valor { get; set; } = string.Empty;

    public DateTime AtualizadoEm { get; set; }

    public string? AtualizadoPor { get; set; }
}
