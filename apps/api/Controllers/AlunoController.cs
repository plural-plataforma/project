using api.DTOs.Aluno;
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
        public class AlunoController : ControllerBase
        {
            private readonly AlunoService _alunoService;
            private readonly UserManager<Usuario> _usuario;

            public AlunoController(AlunoService alunoService, UserManager<Usuario> usuario)
            {
                _alunoService = alunoService;
                _usuario = usuario;
            }

            [HttpPost("cadastro")]
            public async Task<IActionResult> Cadastro([FromBody] AlunoDTO alunoDTO)
            {
                var usuario = await _usuario.GetUserAsync(User);
                if (ModelState.IsValid)
                {
                    var resposta = await _alunoService.Cadastro(alunoDTO, usuario);
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


        /*
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
        }*/

        
        [HttpGet("buscar")]
        public async Task<IActionResult> Buscar()
        {
            var usuario = await _usuario.GetUserAsync(User);
            var resposta = await _alunoService.Buscar(usuario);
            if (resposta.Sucesso)
            {
                return Ok(resposta);
            }
            else
            {
                return BadRequest(resposta);
            }
        }


        [HttpGet("buscar/{idAluno}")]
        public async Task<IActionResult> Buscar(int idAluno)
        {
            var usuario = await _usuario.GetUserAsync(User);
            var resposta = await _alunoService.Buscar(usuario, idAluno);
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
