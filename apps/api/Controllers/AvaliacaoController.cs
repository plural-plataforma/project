using api.Models;
using api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace api.Controllers;

[Authorize(Roles = "Professor, Admin")]
[ApiController]
[Route("api/[controller]")]
public class AvaliacaoController : ControllerBase
{
    private readonly AvaliacaoService _avaliacaoService;
    private readonly UserManager<Usuario> _usuario;

    public AvaliacaoController(AvaliacaoService avaliacaoService, UserManager<Usuario> usuario)
    {
        _avaliacaoService = avaliacaoService;
        _usuario = usuario;
    }

    [HttpGet("buscarAtivos")]
    public async Task<IActionResult> BuscarAtivos()
    {
        var resposta = await _avaliacaoService.GetAvaliacoesAtivas();
        if (resposta.Sucesso)
            return Ok(resposta);
        return BadRequest(resposta);
    }

    [HttpGet("buscarTodos")]
    public async Task<IActionResult> BuscarTodos()
    {
        var resposta = await _avaliacaoService.GetAvaliacoes();
        if (resposta.Sucesso)
            return Ok(resposta);
        return BadRequest(resposta);
    }
}
