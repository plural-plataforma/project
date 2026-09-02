using api.Models;
using api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace api.Controllers;

[Authorize(Roles = "Professor, Admin")]
[ApiController]
[Route("api/[controller]")]
public class NotificacaoController : ControllerBase
{
    private readonly NotificacaoService _service;
    private readonly UserManager<Usuario> _usuario;

    public NotificacaoController(NotificacaoService service, UserManager<Usuario> usuario)
    {
        _service = service;
        _usuario = usuario;
    }

    [HttpGet("listar")]
    public async Task<IActionResult> Listar([FromQuery] bool apenasNaoLidas = false)
    {
        var usuario = await _usuario.GetUserAsync(User);
        if (usuario == null)
            return Unauthorized();

        var resposta = await _service.ListarAsync(usuario, apenasNaoLidas);
        return resposta.Sucesso ? Ok(resposta) : BadRequest(resposta);
    }

    [HttpPost("{id:int}/marcar-lida")]
    public async Task<IActionResult> MarcarComoLida(int id)
    {
        var usuario = await _usuario.GetUserAsync(User);
        if (usuario == null)
            return Unauthorized();

        var resposta = await _service.MarcarComoLidaAsync(id, usuario);
        return resposta.Sucesso ? Ok(resposta) : BadRequest(resposta);
    }

    [HttpPost("marcar-todas-lidas")]
    public async Task<IActionResult> MarcarTodasComoLidas()
    {
        var usuario = await _usuario.GetUserAsync(User);
        if (usuario == null)
            return Unauthorized();

        var resposta = await _service.MarcarTodasComoLidasAsync(usuario);
        return resposta.Sucesso ? Ok(resposta) : BadRequest(resposta);
    }
}
