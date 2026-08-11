using api.DTOs.DocumentoBiblioteca;
using api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace api.Controllers
{
    // Professora consome (lista/baixa); só Admin sobe, edita ou remove.
    [Authorize(Roles = "Professor, Admin")]
    [ApiController]
    [Route("api/biblioteca-modelos")]
    public class DocumentoBibliotecaController : ControllerBase
    {
        private const string ContentTypeDocx =
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

        private readonly DocumentoBibliotecaService _service;

        public DocumentoBibliotecaController(DocumentoBibliotecaService service)
        {
            _service = service;
        }

        [HttpGet]
        public async Task<IActionResult> Get([FromQuery] string? busca, [FromQuery] string? categoria, [FromQuery] bool? ativo)
        {
            var response = await _service.GetAll(busca, categoria, ativo);
            return response.Sucesso ? Ok(response) : BadRequest(response);
        }

        [HttpGet("{id}/download")]
        public async Task<IActionResult> Download(int id)
        {
            var response = await _service.GetArquivoPorId(id);
            if (!response.Sucesso || response.Objeto == null)
                return NotFound(response);

            var documento = response.Objeto;
            return File(documento.ConteudoArquivo, ContentTypeDocx, documento.NomeArquivoOriginal);
        }

        [Authorize(Roles = "Admin")]
        [HttpPost]
        public async Task<IActionResult> Create([FromForm] DocumentoBibliotecaCadastroDTO dto)
        {
            var response = await _service.Cadastro(dto);
            return response.Sucesso ? StatusCode(201, response) : BadRequest(response);
        }

        [Authorize(Roles = "Admin")]
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromForm] DocumentoBibliotecaAtualizarDTO dto)
        {
            var response = await _service.Atualizar(id, dto);
            return response.Sucesso ? Ok(response) : BadRequest(response);
        }

        [Authorize(Roles = "Admin")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var response = await _service.Excluir(id);
            return response.Sucesso ? NoContent() : BadRequest(response);
        }
    }
}
