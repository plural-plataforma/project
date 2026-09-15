using api.DTOs.Atividade;
using api.Services;
using Microsoft.AspNetCore.Authorization;
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

        // Proxy da imagem da atividade: o host externo não manda CORS, então o front não consegue
        // ler os bytes direto pra montar o .docx da Avaliação Diagnóstica.
        [Authorize]
        [HttpGet("{id}/imagem")]
        public async Task<IActionResult> GetImagem(int id)
        {
            var response = await _service.GetImagemAtividade(id);
            if (!response.Sucesso || response.Objeto == null)
                return NotFound(response);

            Response.Headers.CacheControl = "private, max-age=3600";
            return File(response.Objeto.Conteudo, response.Objeto.ContentType);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromForm] AtividadeCadastroDTO dto)
        {
            var response = await _service.Cadastro(dto);

            if (!response.Sucesso)
            {
                return BadRequest(response);
            }

            // Pega o ID da atividade criada
            // Assumindo que T é Atividade ou um DTO com Id
            if (response.Objeto == null || response.Objeto.Id <= 0)
            {
                // Caso raro: criado mas sem ID retornado → 201 sem Location
                return StatusCode(201, response);
            }

            return CreatedAtAction(
                nameof(GetById),
                new { id = response.Objeto.Id },
                response // retorna o objeto criado
             );  
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