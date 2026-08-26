using api.DTOs.Relatorio;
using api.Models;
using api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace api.Controllers;

[Authorize(Roles = "Professor, Admin")]
[ApiController]
[Route("api/[controller]")]
public class RelatorioController : ControllerBase
{
    private readonly RelatorioService _service;
    private readonly UserManager<Usuario> _usuario;

    public RelatorioController(RelatorioService service, UserManager<Usuario> usuario)
    {
        _service = service;
        _usuario = usuario;
    }

    [HttpGet("preview-insumos")]
    public async Task<IActionResult> PreviewInsumos(
        [FromQuery] int alunoId,
        [FromQuery] DateOnly dataInicio,
        [FromQuery] DateOnly dataFim)
    {
        var usuario = await _usuario.GetUserAsync(User);
        if (usuario == null)
            return Unauthorized();

        var resposta = await _service.PreviewInsumosAsync(usuario, alunoId, dataInicio, dataFim);
        return resposta.Sucesso ? Ok(resposta) : BadRequest(resposta);
    }

    [HttpPost("cadastro")]
    public async Task<IActionResult> Cadastrar([FromBody] RelatorioCadastroDTO dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var usuario = await _usuario.GetUserAsync(User);
        if (usuario == null)
            return Unauthorized();

        var resposta = await _service.CriarAsync(dto, usuario);
        return resposta.Sucesso ? Ok(resposta) : BadRequest(resposta);
    }

    [HttpPost("{id:int}/gerar-novamente")]
    public async Task<IActionResult> GerarNovamente(int id)
    {
        var usuario = await _usuario.GetUserAsync(User);
        if (usuario == null)
            return Unauthorized();

        var resposta = await _service.GerarNovamenteAsync(id, usuario);
        if (!resposta.Sucesso)
        {
            return resposta.Mensagens.Any(m => m.Contains("não encontrado", StringComparison.OrdinalIgnoreCase))
                ? NotFound(resposta)
                : BadRequest(resposta);
        }

        return Ok(resposta);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> BuscarPorId(int id)
    {
        var usuario = await _usuario.GetUserAsync(User);
        if (usuario == null)
            return Unauthorized();

        var resposta = await _service.BuscarPorIdAsync(id, usuario);
        return resposta.Sucesso ? Ok(resposta) : NotFound(resposta);
    }

    [HttpPatch("{id:int}/secoes")]
    public async Task<IActionResult> AtualizarSecao(int id, [FromBody] RelatorioSecaoAtualizarDTO dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var usuario = await _usuario.GetUserAsync(User);
        if (usuario == null)
            return Unauthorized();

        var resposta = await _service.AtualizarSecaoAsync(id, dto, usuario);
        return resposta.Sucesso ? Ok(resposta) : BadRequest(resposta);
    }

    [HttpPost("{id:int}/finalizar")]
    public async Task<IActionResult> Finalizar(int id)
    {
        var usuario = await _usuario.GetUserAsync(User);
        if (usuario == null)
            return Unauthorized();

        var resposta = await _service.FinalizarAsync(id, usuario);
        return resposta.Sucesso ? Ok(resposta) : BadRequest(resposta);
    }

    [HttpPost("{id:int}/reabrir")]
    public async Task<IActionResult> Reabrir(int id)
    {
        var usuario = await _usuario.GetUserAsync(User);
        if (usuario == null)
            return Unauthorized();

        var resposta = await _service.ReabrirAsync(id, usuario);
        return resposta.Sucesso ? Ok(resposta) : BadRequest(resposta);
    }
}
