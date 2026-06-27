using api.DTOs.Admin;
using api.Responses;
using api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace api.Controllers
{
    [Authorize(Roles = "Admin")] // descomente quando roles estiverem funcionando
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

        [HttpGet("usuarios/listar")]
        public async Task<IActionResult> ListarParaAdmin(
            [FromQuery] int pagina = 1,
            [FromQuery] int tamanhoPagina = 50,
            [FromQuery] bool? ativo = null,
            [FromQuery] bool? isEmbaixadora = null,
            [FromQuery] string? search = null,
            [FromQuery] string? nivelEnsino = null)
        {
            var resposta = await _adminService.ListarTodosParaAdminAsync(
                pagina: pagina,
                tamanhoPagina: tamanhoPagina,
                ativo: ativo,
                isEmbaixadora: isEmbaixadora,
                search: search,
                nivelEnsino: nivelEnsino
            );

            if (resposta.Sucesso)
            {
                return Ok(resposta.Objeto); // Retorna o PaginatedResult<ProfessorAdminListDTO>
            }

            // Em caso de erro, retorna 500 com a mensagem do serviço
            return StatusCode(500, new
            {
                erro = "Falha ao listar professores",
                detalhe = resposta.Mensagens.FirstOrDefault() ?? "Erro interno"
            });
        }
    }
}