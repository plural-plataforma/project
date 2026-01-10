
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
                var resposta = await _adminService.AtualizarStatusUsuario(dto.IdUsuario,dto.Acao);

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


    }
}
