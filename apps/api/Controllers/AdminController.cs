using api.DTOs.Admin;
using api.Responses;
using api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace api.Controllers
{
    [Authorize(Roles = "Admin,Coordenador")] // descomente quando roles estiverem funcionando
    [ApiController]
    [Route("api/admin")]
    public class AdminController : ControllerBase
    {
        private readonly AdminService _adminService;

        public AdminController(AdminService adminService)
        {
            _adminService = adminService;
        }

        [HttpPatch("usuarios/atualizar")]
        public async Task<IActionResult> AtualizarUsuario([FromBody] AtualizarStatusUsuarioDTO dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var resposta = await _adminService.AtualizarUsuarioAsync(dto);

            if (resposta.Sucesso)
            {
                return Ok(resposta);
            }

            return BadRequest(resposta);
        }
    }
}