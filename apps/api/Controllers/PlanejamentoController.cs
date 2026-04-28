using api.DTOs.Planejamento;
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
    public class PlanejamentoController : ControllerBase
    {
        private readonly PlanejamentoService _planejamentoService;
        private readonly UserManager<Usuario> _usuario;

        public PlanejamentoController(PlanejamentoService planejamentoService, UserManager<Usuario> usuario)
        {
            _planejamentoService = planejamentoService;
            _usuario = usuario;
        }

        [HttpPost("cadastro")]
        public async Task<IActionResult> Cadastro([FromBody] PlanejamentoCadastroDTO planejamentoDTO)
        {
            if (ModelState.IsValid)
            {
                var usuario = await _usuario.GetUserAsync(User);
                var resposta = await _planejamentoService.Cadastro(planejamentoDTO, usuario);
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

        [HttpGet("buscar")]
        public async Task<IActionResult> Buscar()
        {
            var usuario = await _usuario.GetUserAsync(User);
            var resposta = await _planejamentoService.Buscar(usuario);
            if (resposta.Sucesso)
            {
                return Ok(resposta);
            }
            else
            {
                return BadRequest(resposta);
            }
        }

        [HttpGet("buscar/{id}")]
        public async Task<IActionResult> Buscar(int id)
        {
            var usuario = await _usuario.GetUserAsync(User);
            var resposta = await _planejamentoService.Buscar(id, usuario);
            if (resposta.Sucesso)
            {
                return Ok(resposta);
            }
            else
            {
                return BadRequest(resposta);
            }
        }

        [HttpPatch("atualizar")]
        public async Task<IActionResult> Atualizar([FromBody] PlanejamentoAtualizarDTO planejamentoDTO)
        {
            if (ModelState.IsValid)
            {
                var usuario = await _usuario.GetUserAsync(User);
                var resposta = await _planejamentoService.Atualizar(planejamentoDTO, usuario);
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

        [HttpPost("vincularaluno")]
        public async Task<IActionResult> VincularAluno([FromBody] PlanejamentoVincularAlunoDTO planejamentoVincularAlunoDto)
        {
            if (ModelState.IsValid)
            {
                var usuario = await _usuario.GetUserAsync(User);
                var resposta = await _planejamentoService.VincularAluno(planejamentoVincularAlunoDto, usuario);
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

        [HttpPost("vincularhabilidade")]
        public async Task<IActionResult> VincularHabilidade([FromBody] PlanejamentoVincularHabilidadeDTO planejamentoVincularHabilidadeDTO)
        {
            if (ModelState.IsValid)
            {
                var usuario = await _usuario.GetUserAsync(User);
                var resposta = await _planejamentoService.VincularHabilidade(planejamentoVincularHabilidadeDTO, usuario);
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
        [HttpPost("vincularestrategia")]
        public async Task<IActionResult> VincularEstrategias([FromBody] PlanejamentoVincularEstrategiaDTO planejamentoVincularEstrategiaDTO)
        {
            if (ModelState.IsValid)
            {
                var usuario = await _usuario.GetUserAsync(User);
                var resposta = await _planejamentoService.VincularEstrategias(planejamentoVincularEstrategiaDTO, usuario);
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

        [HttpPost("vincularavaliacao")]
        public async Task<IActionResult> VincularAvaliacoes([FromBody] PlanejamentoVincularAvaliacaoDTO planejamentoVincularAvaliacaoDTO)
        {
            if (ModelState.IsValid)
            {
                var usuario = await _usuario.GetUserAsync(User);
                var resposta = await _planejamentoService.VincularAvaliacoes(planejamentoVincularAvaliacaoDTO, usuario);
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

        [HttpPost("vincularalunoslote")]
        public async Task<IActionResult> VincularAlunosEmLote([FromBody] PlanejamentoVincularAlunosLoteDTO dto)
        {
            if (ModelState.IsValid)
            {
                var usuario = await _usuario.GetUserAsync(User);
                var resposta = await _planejamentoService.VincularAlunosEmLote(dto, usuario);
                if (resposta.Sucesso)
                {
                    return Ok(resposta);
                }

                return BadRequest(resposta);
            }

            return BadRequest(ModelState);
        }

        [HttpPost("vincularhabilidadeslote")]
        public async Task<IActionResult> VincularHabilidadesEmLote([FromBody] PlanejamentoVincularHabilidadesLoteDTO dto)
        {
            if (ModelState.IsValid)
            {
                var usuario = await _usuario.GetUserAsync(User);
                var resposta = await _planejamentoService.VincularHabilidadesEmLote(dto, usuario);
                if (resposta.Sucesso)
                {
                    return Ok(resposta);
                }

                return BadRequest(resposta);
            }

            return BadRequest(ModelState);
        }

        [HttpPost("vincularestrategiaslote")]
        public async Task<IActionResult> VincularEstrategiasEmLote([FromBody] PlanejamentoVincularEstrategiasLoteDTO dto)
        {
            if (ModelState.IsValid)
            {
                var usuario = await _usuario.GetUserAsync(User);
                var resposta = await _planejamentoService.VincularEstrategiasEmLote(dto, usuario);
                if (resposta.Sucesso)
                {
                    return Ok(resposta);
                }

                return BadRequest(resposta);
            }

            return BadRequest(ModelState);
        }

        [HttpPost("vincularavaliacoeslote")]
        public async Task<IActionResult> VincularAvaliacoesEmLote([FromBody] PlanejamentoVincularAvaliacoesLoteDTO dto)
        {
            if (ModelState.IsValid)
            {
                var usuario = await _usuario.GetUserAsync(User);
                var resposta = await _planejamentoService.VincularAvaliacoesEmLote(dto, usuario);
                if (resposta.Sucesso)
                {
                    return Ok(resposta);
                }

                return BadRequest(resposta);
            }

            return BadRequest(ModelState);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Excluir(int id)
        {
            var usuario = await _usuario.GetUserAsync(User);
            var resposta = await _planejamentoService.Excluir(id, usuario);
            if (resposta.Sucesso)
            {
                return Ok(resposta);
            }
            return BadRequest(resposta);
        }
    }
}
