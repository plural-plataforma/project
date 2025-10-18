using api.DTOs.Professor;
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
    public class ProfessorController : ControllerBase
    {
        private readonly ProfessorService _professorService;
        private readonly UserManager<Usuario> _usuario;

        public ProfessorController(ProfessorService professorService, UserManager<Usuario> usuario)
        {
            _professorService = professorService;
            _usuario = usuario;
        }

        [HttpPatch("atualizar")]
        public async Task<IActionResult> Atualizar([FromBody] ProfessorDTO professor)
        {
            var usuario = await _usuario.GetUserAsync(User);
            var idProfessor = (int)usuario.ProfessorId;

            if (ModelState.IsValid)
            {
                var resposta = await _professorService.Atualizar(professor, idProfessor);
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
            var usuario = await _usuario.GetUserAsync(User);
            var resposta = await _professorService.Buscar(usuario);
            if (resposta.Sucesso)
            {
                return Ok(resposta);
            }
            else
            {
                return BadRequest(resposta);
            }
        }

        [HttpPost("vincularescola")]
        public async Task<IActionResult> VincularEscola([FromBody] ProfessorVincularEscolaDTO professorVincularEscolaDto)
        {
            var usuario = await _usuario.GetUserAsync(User);
            var idProfessor = (int)usuario.ProfessorId;
            if (ModelState.IsValid)
            {
                var resposta = await _professorService.VincularEscola(professorVincularEscolaDto.IdEscola, idProfessor);
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

        [HttpGet("buscarescolas")]
        public async Task<IActionResult> BuscarEscolas()
        {
            var usuario = await _usuario.GetUserAsync(User);
            var idProfessor = (int)usuario.ProfessorId;
            var resposta = await _professorService.BuscarEscolas(idProfessor);
            if (resposta.Sucesso)
            {
                return Ok(resposta);
            }
            else
            {
                return BadRequest(resposta);
            }
        }

        [HttpPost("desvincularescola")]
        public async Task<IActionResult> DesvincularEscola([FromBody] ProfessorVincularEscolaDTO professorVincularEscolaDto)
        {
            var usuario = await _usuario.GetUserAsync(User);
            var idProfessor = (int)usuario.ProfessorId;
            if (ModelState.IsValid)
            {
                var resposta = await _professorService.DesvincularEscola(professorVincularEscolaDto.IdEscola, idProfessor);
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
