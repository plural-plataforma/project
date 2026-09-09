using api.Models;
using api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace api.Controllers;

[Authorize(Roles = "Professor")]
[ApiController]
[Route("api/termos")]
public class TermosController : ControllerBase
{
    private readonly TermoService _service;
    private readonly UserManager<Usuario> _usuario;

    public TermosController(TermoService service, UserManager<Usuario> usuario)
    {
        _service = service;
        _usuario = usuario;
    }

    [HttpGet("pendentes")]
    public async Task<IActionResult> Pendentes()
    {
        var usuario = await _usuario.GetUserAsync(User);
        if (usuario == null)
            return Unauthorized();

        var resposta = await _service.ObterPendentesAsync(usuario);
        return Ok(resposta);
    }

    public class AceitarTermoDTO
    {
        public int TermoVersaoId { get; set; }
    }

    [HttpPost("aceitar")]
    public async Task<IActionResult> Aceitar([FromBody] AceitarTermoDTO dto)
    {
        var usuario = await _usuario.GetUserAsync(User);
        if (usuario == null)
            return Unauthorized();

        var ip = HttpContext.Connection.RemoteIpAddress?.ToString();
        var resposta = await _service.AceitarAsync(usuario, dto.TermoVersaoId, ip);

        return resposta.Sucesso ? Ok(resposta) : BadRequest(resposta);
    }
}
