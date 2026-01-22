
using api.DTOs.Admin;
using api.Models;
using api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace api.Controllers
{
    //[Authorize(Roles = "Admin")]
    [ApiController]
    [Route("api/[controller]")]
    public class AdminController : ControllerBase
    {
        private readonly UserManager<Usuario> _usuario;
        private readonly AdminService _adminService;

        public AdminController(UserManager<Usuario> usuario, AdminService adminService)
        {
            _usuario = usuario;
            _adminService = adminService;
        }

        [HttpPatch("atualizarStatusUsuario")]
        public async Task<IActionResult> AtualizarStatusUsuario([FromBody] AtualizarStatusUsuarioDTO dto)
        {

            if (ModelState.IsValid)
            {
                var resposta = await _adminService.AtualizarStatusUsuario(dto);

                if (resposta.Sucesso)
                {
                    return Ok(resposta);
                } else
                {   
                    BadRequest(resposta);
                }
            }
            else
            {
                return BadRequest(ModelState);
            }

            return BadRequest();
        }

        [HttpGet("buscarPermissoes/{idUsuario}")]
        public async Task<IActionResult> BuscarPermissoesUsuario(int idUsuario)
        {
            var permissoes = await _adminService.BuscarPermissoesUsuario(idUsuario);

            if (permissoes.Sucesso)
            {
                return Ok(permissoes);
            }
            else
            {
                return BadRequest(permissoes);

            }

        }

        [HttpPut("alterarPermissoesUsuario")]
        public async Task<IActionResult> AlterarPermissoesUsuario([FromBody] AlterarPermissoesUsuarioDTO dto)
        {
            if (ModelState.IsValid)
            {
                var resposta = await _adminService.AlterarPermissoesUsuario(dto);

                if (resposta.Sucesso)
                {
                    return Ok(resposta);
                }
                else
                {
                    return BadRequest(resposta);
                }
            }
            return BadRequest(ModelState);
        }

        [HttpPost("criarPermissao")]
        public async Task<IActionResult> CriarPermissao(string nomePermissao)
        {
            if(nomePermissao == null)
            {
                return BadRequest("Nome da permissão não pode ser nulo.");
            }

            var resposta = await _adminService.CriarPermissao(nomePermissao);
            if (resposta.Sucesso)
            {
                return Ok(resposta);
            }

            return BadRequest(resposta);

        }
    }
}
