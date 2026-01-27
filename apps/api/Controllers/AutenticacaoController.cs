using System.Security.Claims;
using api.DTOs.Autenticacao;
using api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AutenticacaoController : ControllerBase
    {
        private readonly AutenticacaoService _autenticacaoService;

        public AutenticacaoController(AutenticacaoService autenticacaoService)
        {
            _autenticacaoService = autenticacaoService;
        }

        [HttpPost("registro")]
        public async Task<IActionResult> Registro([FromBody] RegistroDTO registro)
        {
            if (ModelState.IsValid)
            {
                var retorno = await _autenticacaoService.Registro(registro);
                if (retorno.Succeeded)
                {
                    return Ok("Usuário criado com sucesso");
                }
                else
                {
                    return BadRequest(retorno.Errors);
                }
            }
            else
            {
                return BadRequest(ModelState);
            }
        }


        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDTO login)
        {
            if (ModelState.IsValid)
            {
                var resposta = await _autenticacaoService.Login(login);
                if (resposta.Mensagens.Count >0)
                {
                    return Unauthorized(resposta.Mensagens.FirstOrDefault());
                }

                return Ok(new { Token = resposta.Objeto});
            }
            else
            {
                return BadRequest(ModelState);
            }
        }

        [Authorize]
        [HttpPost("alterarsenha")]
        public async Task<IActionResult> AlterarSenha([FromBody] AlterarSenhaDTO alterarSenhaDto)
        {
            if (ModelState.IsValid)
            {
                var resultado = await _autenticacaoService.AlterarSenha(alterarSenhaDto, User);
                if (resultado.Succeeded)
                {
                    return Ok("Senha alterada com sucesso");
                }
                else
                {
                    return BadRequest(resultado.Errors);
                }
            }
            else
            {
                return BadRequest(ModelState);
            }
        }

        [Authorize]
        [HttpPost("alteraremail")]
        public async Task<IActionResult> AlterarEmail([FromBody] AlterarEmailDTO alterarEmailDTO)
        {
            if (ModelState.IsValid)
            {
                var resultado = await _autenticacaoService.AlterarEmail(alterarEmailDTO, User);
                if (resultado.Succeeded)
                {
                    return Ok("Email alterado com sucesso");
                }
                else
                {
                    return BadRequest(resultado.Errors);
                }
            }
            else
            {
                return BadRequest(ModelState);
            }
        }

        [HttpPost("adiar-troca-senha")]
        [Authorize]  // ← importante: só usuário logado pode chamar
        public async Task<IActionResult> AdiarTrocaSenha()
        {
            var resultado = await _autenticacaoService.AdiarTrocaSenha(User);

            if (!resultado.Succeeded)
            {
                return BadRequest(new
                {
                    success = false,
                    errors = resultado.Errors.Select(e => e.Description)
                });
            }

            return Ok(new { success = true });
        }
    }
}
