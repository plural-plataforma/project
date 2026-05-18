using api.DTOs.EstudoDeCaso;
using api.Models;
using api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace api.Controllers;

[Authorize(Roles = "Professor, Admin")]
[ApiController]
[Route("api/[controller]")]
public class EstudoDeCasoController : ControllerBase
{
    private readonly EstudoDeCasoService _service;
    private readonly UserManager<Usuario> _userManager;

    public EstudoDeCasoController(EstudoDeCasoService service, UserManager<Usuario> userManager)
    {
        _service = service;
        _userManager = userManager;
    }

    [HttpGet("eixos-catalogo")]
    public async Task<IActionResult> ListarEixosCatalogo()
    {
        var resposta = await _service.ListarEixosCatalogoAsync();
        return resposta.Sucesso ? Ok(resposta) : BadRequest(resposta);
    }

    [HttpGet("por-aluno/{alunoId:int}")]
    public async Task<IActionResult> ListarPorAluno(int alunoId)
    {
        var usuario = await _userManager.GetUserAsync(User);
        if (usuario == null)
            return Unauthorized();

        var resposta = await _service.ListarPorAlunoAsync(alunoId, usuario);
        if (!resposta.Sucesso)
            return BadRequest(resposta);
        return Ok(resposta);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> BuscarPorId(int id)
    {
        var usuario = await _userManager.GetUserAsync(User);
        if (usuario == null)
            return Unauthorized();

        var resposta = await _service.BuscarPorIdAsync(id, usuario);
        if (!resposta.Sucesso)
        {
            return resposta.Mensagens.Any(m => m.Contains("não encontrado", StringComparison.OrdinalIgnoreCase))
                ? NotFound(resposta)
                : BadRequest(resposta);
        }

        return Ok(resposta);
    }

    [HttpPost("cadastro")]
    public async Task<IActionResult> Cadastrar([FromBody] EstudoDeCasoCadastroDTO dto)
    {
        var usuario = await _userManager.GetUserAsync(User);
        if (usuario == null)
            return Unauthorized();

        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var resposta = await _service.CadastrarAsync(dto, usuario);
        return resposta.Sucesso ? Ok(resposta) : BadRequest(resposta);
    }

    [HttpPost("{id:int}/gerar-texto-simulado")]
    public async Task<IActionResult> GerarTextoSimulado(int id)
    {
        var usuario = await _userManager.GetUserAsync(User);
        if (usuario == null)
            return Unauthorized();

        var resposta = await _service.GerarTextoSimuladoAsync(id, usuario);
        if (!resposta.Sucesso)
        {
            return resposta.Mensagens.Any(m => m.Contains("não encontrado", StringComparison.OrdinalIgnoreCase))
                ? NotFound(resposta)
                : BadRequest(resposta);
        }

        return Ok(resposta);
    }
}
