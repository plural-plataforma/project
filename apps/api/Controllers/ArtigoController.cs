using api.DTOs.Artigo;
using api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace api.Controllers
{
    [Authorize(Roles = "Admin")]
    [ApiController]
    [Route("api/artigos")]
    public class ArtigoController : ControllerBase
    {
        private readonly ArtigoService _service;

        public ArtigoController(ArtigoService service)
        {
            _service = service;
        }

        [HttpGet]
        public async Task<IActionResult> Get([FromQuery] string? busca, [FromQuery] string? categoria, [FromQuery] bool? publicado)
        {
            var response = await _service.GetAll(busca, categoria, publicado);
            return response.Sucesso ? Ok(response) : BadRequest(response);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetPorId(int id)
        {
            var response = await _service.GetPorId(id);
            return response.Sucesso ? Ok(response) : NotFound(response);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] ArtigoCadastroDTO dto)
        {
            var response = await _service.Cadastro(dto);
            return response.Sucesso ? StatusCode(201, response) : BadRequest(response);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] ArtigoAtualizarDTO dto)
        {
            var response = await _service.Atualizar(id, dto);
            return response.Sucesso ? Ok(response) : BadRequest(response);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var response = await _service.Excluir(id);
            return response.Sucesso ? NoContent() : BadRequest(response);
        }
    }
}
