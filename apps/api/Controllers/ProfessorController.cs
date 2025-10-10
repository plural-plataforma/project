using api.DTOs.Autenticacao;
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
            var resposta = await _professorService.Buscar((int)usuario.ProfessorId);
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
