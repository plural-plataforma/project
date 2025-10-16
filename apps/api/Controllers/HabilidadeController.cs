using api.DTOs;
using api.DTOs.Habilidade;
using api.Models;
using api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace api.Controllers
{
    [Authorize(Roles = "Professor, Admin")]
    [ApiController]
    [Route("api/[controller]")]
    public class HabilidadeController : ControllerBase
    {
        private readonly HabilidadeService _habilidadeService;
        private readonly UserManager<Usuario> _usuario;

        public HabilidadeController(HabilidadeService habilidadeService, UserManager<Usuario> usuario)
        {
            _habilidadeService = habilidadeService;
            _usuario = usuario;
        }

        [HttpPost("cadastro")]
        public async Task<IActionResult> Cadastro([FromBody] HabilidadeCadastroDTO habilidadeDTO)
        {
            if (ModelState.IsValid)
            {
                var resposta = await _habilidadeService.Cadastro(habilidadeDTO);
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


        
        [HttpPatch("atualizar")]
        public async Task<IActionResult> Atualizar([FromBody] HabilidadeAtualizarDTO habilidadeDTO)
        {
            if (ModelState.IsValid)
            {
                var resposta = await _habilidadeService.Atualizar(habilidadeDTO);
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
            var resposta = await _habilidadeService.Buscar();
            if (resposta.Sucesso)
            {
                return Ok(resposta);
            }
            else
            {
                return BadRequest(resposta);
            }
        }

    }
}
