using api.Models;

namespace api.DTOs.Notificacao;

public class NotificacaoDTO
{
    public int Id { get; set; }
    public TipoNotificacao Tipo { get; set; }
    public string Titulo { get; set; } = "";
    public string Mensagem { get; set; } = "";
    public int? RelatorioId { get; set; }
    public bool Lida { get; set; }
    public DateTime CreatedAt { get; set; }
}
