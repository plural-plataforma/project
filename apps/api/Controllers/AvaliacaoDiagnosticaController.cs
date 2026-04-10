using api.DTOs.AvaliacaoDiagnostica;
using api.DTOs.Desempenho;
using api.Models;
using api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

[Authorize(Roles = "Professor, Admin")]
[ApiController]
[Route("api/avaliacaodiagnostica")]
public class AvaliacaoDiagnosticaController : ControllerBase
{
    private readonly AvaliacaoDiagnosticaService _service;
    private readonly UserManager<Usuario> _userManager;

    public AvaliacaoDiagnosticaController(AvaliacaoDiagnosticaService service, UserManager<Usuario> userManager)
    {
        _service = service;
        _userManager = userManager;
    }

    [HttpGet("buscarTodos")]
    public async Task<IActionResult> BuscarTodos()
    {
        var usuario = await _userManager.GetUserAsync(User);
        var resposta = await _service.GetAll(usuario);
        return resposta.Sucesso ? Ok(resposta) : BadRequest(resposta);
    }

    [HttpGet("buscarNaoConcluidas")]
    public async Task<IActionResult> BuscarNaoConcluidas()
    {
        var usuario = await _userManager.GetUserAsync(User);
        var resposta = await _service.GetNaoConcluidas(usuario);
        return resposta.Sucesso ? Ok(resposta) : BadRequest(resposta);
    }

    [HttpPost("cadastro")]
    public async Task<IActionResult> Cadastro([FromBody] AvaliacaoDiagnosticaDTO dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var usuario = await _userManager.GetUserAsync(User);
        var resposta = await _service.Create(dto, usuario);
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

        var usuario = await _userManager.GetUserAsync(User);
        var resposta = await _service.Update(id, dto, usuario);
        if (!resposta.Sucesso)
        {
            return resposta.Mensagens.Any(m => m.Contains("não encontrada"))
                ? NotFound(resposta)
                : BadRequest(resposta);
        }
        return Ok(resposta);
    }

    [HttpPatch("reivindicar/{id}")]
    public async Task<IActionResult> Reivindicar(int id)
    {
        var usuario = await _userManager.GetUserAsync(User);
        var resposta = await _service.Reivindicar(id, usuario);
        if (!resposta.Sucesso)
        {
            return resposta.Mensagens.Any(m => m.Contains("não encontrada"))
                ? NotFound(resposta)
                : BadRequest(resposta);
        }
        return Ok(resposta);
    }

    [HttpPost("desempenhos/batch")]
    public async Task<IActionResult> RegistrarDesempenhosBatch([FromBody] RegistrarDesempenhoBatchDTO dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var resposta = await _service.RegistrarDesempenhoBatch(dto);
        return resposta.Sucesso ? Ok(resposta) : BadRequest(resposta);
    }

    [HttpGet("desempenhos/historico/{avaliacaoId}")]
    public async Task<IActionResult> BuscarHistoricoDesempenho(int avaliacaoId)
    {
        var resposta = await _service.BuscarHistoricoDesempenho(avaliacaoId);
        if (!resposta.Sucesso)
        {
            return resposta.Mensagens.Any(m => m.Contains("não encontrada"))
                ? NotFound(resposta)
                : BadRequest(resposta);
        }
        return Ok(resposta);
    }

    [HttpGet("gerar-pdf/{id}")]  // ou POST, conforme preferir
    public async Task<IActionResult> GerarPdf(int id)
    {
        try
        {
            var pdfBytes = await _service.GerarPdfBytesAsync(id);
            return File(pdfBytes, "application/pdf", $"avaliacao-{id}.pdf");
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new { mensagem = ex.Message });
        }
        catch (Exception ex)
        {
            var inner = ex.InnerException?.Message ?? "Sem inner exception";
            return StatusCode(500, new
            {
                mensagem = "Erro ao gerar PDF",
                detalhes = ex.Message,
                innerException = inner,
                stackTrace = ex.ToString()
            });
        }
    }
}