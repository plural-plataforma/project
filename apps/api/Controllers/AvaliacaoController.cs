using api.DTOs.Avaliacao;
using api.Models;
using api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

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

    [HttpGet("buscarTodos")]
    public async Task<IActionResult> BuscarTodos()
    {
        var resposta = await _avaliacaoService.GetAvaliacoes();
        if (resposta.Sucesso)
        {
            return Ok(resposta);
        }
        else
        {
            return BadRequest(resposta);
        }
    }

    [HttpGet("buscarAtivos")]
    public Task<IActionResult> BuscarAtivos()
    {
        var resposta = _avaliacaoService.GetAvaliacoesAtivas();
        if (resposta.Sucesso)
        {
            return Task.FromResult<IActionResult>(Ok(resposta));
        }
        else
        {
            return Task.FromResult<IActionResult>(BadRequest(resposta));
        }
    }

    [HttpPost("cadastro")]
    public async Task<IActionResult> Cadastro([FromBody] AvaliacaoCadastroDTO avaliacaoDTO)
    {
        if (ModelState.IsValid)
        {
            var resposta = await _avaliacaoService.Cadastro(avaliacaoDTO);
            if (resposta.Sucesso)
            {
                return Ok(resposta);
            }
            else
            {
                return BadRequest(resposta);
            }
        }
        else
        {
            return BadRequest(ModelState);
        }
    }
    [HttpGet("buscar/{id}")]
    public async Task<IActionResult> BuscarPorId(int id)
    {
        var resposta = await _avaliacaoService.GetAvaliacaoPorId(id);

        if (!resposta.Sucesso)
        {
            return resposta.Mensagens.Any(m => m.Contains("não encontrada"))
                ? NotFound(resposta)
                : BadRequest(resposta);
        }

        return Ok(resposta);
    }

    [HttpPut("atualizar/{id}")]
    public async Task<IActionResult> Atualizar(int id, [FromBody] AvaliacaoAtualizarDTO avaliacaoDTO)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var resposta = await _avaliacaoService.Atualizar(id, avaliacaoDTO);

        return resposta.Sucesso
            ? Ok(resposta)
            : NotFound(resposta); // ou BadRequest, dependendo do erro
    }


}