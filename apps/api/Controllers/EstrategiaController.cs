using api.DTOs.Estrategia;
using api.Models;
using api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

[Authorize(Roles = "Professor, Admin")]
[ApiController]
[Route("api/[controller]")]
public class EstrategiaController : ControllerBase
{
    private readonly EstrategiaService _estrategiaService;
    private readonly UserManager<Usuario> _usuario;
    public EstrategiaController(EstrategiaService estrategiaService, UserManager<Usuario> usuario)
    {
        _estrategiaService = estrategiaService;
        _usuario = usuario;
    }

    [HttpGet("buscarTodos")]
    public async Task<IActionResult> BuscarTodos()
    {
        var resposta = await _estrategiaService.GetEstrategias();
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
    public async Task<IActionResult> BuscarAtivos()
    {
        var resposta = await _estrategiaService.GetEstrategiasAtivas();
        if (resposta.Sucesso)
        {
            return Ok(resposta);
        }
        else
        {
            return BadRequest(resposta);
        }
    }

    [HttpPost("cadastro")]
    public async Task<IActionResult> Cadastro([FromBody] EstrategiaCadastroDTO estrategiaDTO)
    {
        if (ModelState.IsValid)
        {
            var resposta = await _estrategiaService.Cadastro(estrategiaDTO);
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
        var resposta = await _estrategiaService.GetEstrategiaPorId(id);

        if (!resposta.Sucesso)
        {
            return resposta.Mensagens.Any(m => m.Contains("não encontrada"))
                ? NotFound(resposta)
                : BadRequest(resposta);
        }

        return Ok(resposta);
    }

    [HttpPut("atualizar/{id}")]
    public async Task<IActionResult> Atualizar(int id, [FromBody] EstrategiaAtualizarDTO estrategiaDTO)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var resposta = await _estrategiaService.Atualizar(id, estrategiaDTO);

        return resposta.Sucesso
            ? Ok(resposta)
            : NotFound(resposta); // ou BadRequest, dependendo do erro
    }


}