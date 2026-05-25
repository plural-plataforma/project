using api.DTOs.RelatoAtendimento;
using api.Models;
using api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace api.Controllers;

[Authorize(Roles = "Professor, Admin")]
[ApiController]
[Route("api/[controller]")]
public class RelatoAtendimentoController : ControllerBase
{
    private readonly RelatoAtendimentoService _service;
    private readonly UserManager<Usuario> _usuario;

    public RelatoAtendimentoController(RelatoAtendimentoService service, UserManager<Usuario> usuario)
    {
        _service = service;
        _usuario = usuario;
    }

    [HttpGet("listar")]
    public async Task<IActionResult> Listar([FromQuery] int? alunoId, [FromQuery] DateOnly? dataInicio,
        [FromQuery] DateOnly? dataFim)
    {
        var usuario = await _usuario.GetUserAsync(User);
        if (usuario == null)
            return Unauthorized();

        var resposta = await _service.ListarAsync(usuario, alunoId, dataInicio, dataFim);
        return resposta.Sucesso ? Ok(resposta) : BadRequest(resposta);
    }

    [HttpGet("relatorio-consolidado")]
    public async Task<IActionResult> RelatorioConsolidado([FromQuery] DateOnly dataInicio,
        [FromQuery] DateOnly dataFim,
        [FromQuery] int? alunoId)
    {
        var usuario = await _usuario.GetUserAsync(User);
        if (usuario == null)
            return Unauthorized();

        var resposta = await _service.RelatorioConsolidadoAsync(usuario, dataInicio, dataFim, alunoId);
        return resposta.Sucesso ? Ok(resposta) : BadRequest(resposta);
    }

    [HttpGet("sugestoes-mes")]
    public async Task<IActionResult> SugestoesMes([FromQuery] int alunoId, [FromQuery] int ano,
        [FromQuery] int mes)
    {
        var usuario = await _usuario.GetUserAsync(User);
        if (usuario == null)
            return Unauthorized();

        var resposta = await _service.SugestoesMesAsync(usuario, alunoId, ano, mes);
        return resposta.Sucesso ? Ok(resposta) : BadRequest(resposta);
    }

    [HttpPost("cadastro")]
    public async Task<IActionResult> Cadastrar([FromBody] RelatoAtendimentoCadastroDTO dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var usuario = await _usuario.GetUserAsync(User);
        if (usuario == null)
            return Unauthorized();

        var resposta = await _service.Cadastrar(dto, usuario);
        return resposta.Sucesso ? Ok(resposta) : BadRequest(resposta);
    }

    [HttpPatch("atualizar")]
    public async Task<IActionResult> Atualizar([FromBody] RelatoAtendimentoAtualizarDTO dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var usuario = await _usuario.GetUserAsync(User);
        if (usuario == null)
            return Unauthorized();

        var resposta = await _service.Atualizar(dto, usuario);
        return resposta.Sucesso ? Ok(resposta) : BadRequest(resposta);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Excluir(int id)
    {
        var usuario = await _usuario.GetUserAsync(User);
        if (usuario == null)
            return Unauthorized();

        var resposta = await _service.Excluir(id, usuario);
        return resposta.Sucesso ? Ok(resposta) : BadRequest(resposta);
    }
}
