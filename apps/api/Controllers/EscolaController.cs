using api.DTOs.Autenticacao;
using api.DTOs.Escola;
using api.DTOs.Professor;
using api.Models;
using api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ModelBinding;

namespace api.Controllers
{
    [Authorize(Roles = "Professor, Admin")]
    [ApiController]
    [Route("api/[controller]")]
    public class EscolaController : ControllerBase
    {
        private readonly EscolaService _escolaService;
        private readonly UserManager<Usuario> _usuario;

        public EscolaController(EscolaService escolaService, UserManager<Usuario> usuario)
        {
            _escolaService = escolaService;
            _usuario = usuario;
        }

        [HttpPost("cadastro")]
        public async Task<IActionResult> Cadastro([FromBody] EscolaDTO escola)
        {
            if (ModelState.IsValid)
            {
                var resposta = await _escolaService.Cadastro(escola);
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

        [HttpGet("buscar")]
        public async Task<IActionResult> Buscar()
        {
            var resposta = await _escolaService.Buscar();
            if (resposta.Sucesso)
            {
                return Ok(resposta);
            }
            else
            {
                return BadRequest(resposta);
            }
        }

        [HttpGet("buscar/{id}")]
        public async Task<IActionResult> Buscar(int id)
        {
            var resposta = await _escolaService.Buscar(id);
            if (resposta.Sucesso)
            {
                return Ok(resposta);
            }
            else
            {
                return BadRequest(resposta);
            }
        }

        [HttpPatch("atualizar")]
        public async Task<IActionResult> Atualizar([FromBody] EscolaComIdDTO escolaDTO)
        {
            if (ModelState.IsValid)
            {
                var resposta = await _escolaService.Atualizar(escolaDTO);
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
    }
}
