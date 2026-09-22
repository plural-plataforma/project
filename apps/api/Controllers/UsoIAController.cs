using api.Models;
using api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace api.Controllers;

[Authorize(Roles = "Professor, Admin")]
[ApiController]
[Route("api/[controller]")]
public class UsoIAController : ControllerBase
{
    private readonly LimiteUsoIAService _limiteUsoIAService;
    private readonly UserManager<Usuario> _usuario;

    public UsoIAController(LimiteUsoIAService limiteUsoIAService, UserManager<Usuario> usuario)
    {
        _limiteUsoIAService = limiteUsoIAService;
        _usuario = usuario;
    }

    [HttpGet("limite")]
    public async Task<IActionResult> Limite()
    {
        var usuario = await _usuario.GetUserAsync(User);
        if (usuario == null)
            return Unauthorized();

        var resposta = await _limiteUsoIAService.ObterUsoAsync(usuario.ProfessorId ?? 0);
        return resposta.Sucesso ? Ok(resposta) : BadRequest(resposta);
    }
}
