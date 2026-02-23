using api.DTOs.AvaliacaoDiagnostica;
using api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[Authorize(Roles = "Professor, Admin")]
[ApiController]
[Route("api/avaliacaodiagnostica")]
public class AvaliacaoDiagnosticaController : ControllerBase
{
    private readonly AvaliacaoDiagnosticaService _service;

    public AvaliacaoDiagnosticaController(AvaliacaoDiagnosticaService service)
    {
        _service = service;
    }

    [HttpGet("buscarTodos")]
    public async Task<IActionResult> BuscarTodos()
    {
        var resposta = await _service.GetAll();
        return resposta.Sucesso ? Ok(resposta) : BadRequest(resposta);
    }

    [HttpGet("buscarNaoConcluidas")]
    public async Task<IActionResult> BuscarNaoConcluidas()
    {
        var resposta = await _service.GetNaoConcluidas();
        return resposta.Sucesso ? Ok(resposta) : BadRequest(resposta);
    }

    [HttpPost("cadastro")]
    public async Task<IActionResult> Cadastro([FromBody] AvaliacaoDiagnosticaDTO dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var resposta = await _service.Create(dto);
        return resposta.Sucesso ? Ok(resposta) : BadRequest(resposta);
    }

    [HttpGet("buscar/{id}")]
    public async Task<IActionResult> BuscarPorId(int id)
    {
        var resposta = await _service.GetById(id);
        if (!resposta.Sucesso)
        {
            return resposta.Mensagens.Any(m => m.Contains("não encontrada"))
                ? NotFound(resposta)
                : BadRequest(resposta);
        }
        return Ok(resposta);
    }

    [HttpPut("atualizar/{id}")]
    public async Task<IActionResult> Atualizar(int id, [FromBody] UpdateAvaliacaoDiagnosticaDTO dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var resposta = await _service.Update(id, dto);
        if (!resposta.Sucesso)
        {
            return resposta.Mensagens.Any(m => m.Contains("não encontrada"))
                ? NotFound(resposta)
                : BadRequest(resposta);
        }
        return Ok(resposta);
    }
}