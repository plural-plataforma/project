using api.DTOs.Atividade;
using api.Services;
using Microsoft.AspNetCore.Mvc;

namespace api.Controllers
{
    [Route("api/atividades")]
    [ApiController]
    public class AtividadesController : ControllerBase
    {
        private readonly AtividadeService _service;

        public AtividadesController(AtividadeService service)
        {
            _service = service;
        }

        [HttpGet]
        public async Task<IActionResult> Get([FromQuery] string? busca, [FromQuery] int? blocoId, [FromQuery] string? nivel, [FromQuery] string? etapa, [FromQuery] bool? ativo, [FromQuery] int page = 1, [FromQuery] int pageSize = 10)
        {
            var response = await _service.GetAtividades(busca, blocoId, nivel, etapa, ativo, page, pageSize);
            return response.Sucesso ? Ok(response) : BadRequest(response);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var response = await _service.GetAtividadePorId(id);
            return response.Sucesso ? Ok(response) : NotFound(response);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromForm] AtividadeCadastroDTO dto) // FromForm para upload de arquivo
        {
            var response = await _service.Cadastro(dto);
            return response.Sucesso ? CreatedAtAction(nameof(GetById), response) : BadRequest(response);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromForm] AtividadeAtualizarDTO dto)
        {
            var response = await _service.Atualizar(id, dto);
            return response.Sucesso ? NoContent() : BadRequest(response);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var response = await _service.Excluir(id);
            return response.Sucesso ? NoContent() : BadRequest(response);
        }

        [HttpPut("{id}/habilidades")]
        public async Task<IActionResult> SyncHabilidades(int id, [FromBody] AtividadeSyncHabilidadesDTO dto)
        {
            var response = await _service.SyncHabilidades(id, dto.HabilidadeIds);
            return response.Sucesso ? NoContent() : BadRequest(response);
        }
    }
}