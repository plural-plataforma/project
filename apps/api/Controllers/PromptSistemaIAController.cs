using api.DTOs.PromptSistemaIA;
using api.Models;
using api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace api.Controllers
{
    [Authorize(Roles = "Admin")]
    [ApiController]
    [Route("api/prompt-sistema-ia")]
    public class PromptSistemaIAController : ControllerBase
    {
        private readonly PromptSistemaIAService _service;

        public PromptSistemaIAController(PromptSistemaIAService service)
        {
            _service = service;
        }

        [HttpGet]
        public async Task<IActionResult> Listar()
        {
            var response = await _service.ListarAsync();
            return response.Sucesso ? Ok(response) : BadRequest(response);
        }

        [HttpPut("{tipo}")]
        public async Task<IActionResult> Atualizar(string tipo, [FromBody] PromptSistemaIAAtualizarDTO dto)
        {
            if (!Enum.TryParse<TipoDocumentoIA>(tipo, true, out var tipoDocumento))
                return BadRequest(new { mensagem = $"Tipo de documento inválido: {tipo}" });

            var response = await _service.AtualizarAsync(tipoDocumento, dto);
            return response.Sucesso ? Ok(response) : BadRequest(response);
        }
    }
}
