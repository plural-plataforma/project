using api.Models;
using api.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

[ApiController]
[Route("api/vendas")]
public class VendasController : ControllerBase
{
    private readonly HotmartService _hotmart;
    private readonly ProfessorService _professorService;
    private readonly UserManager<Usuario> _usuario;

    public VendasController(HotmartService hotmart, ProfessorService professorService, UserManager<Usuario> usuario)
    {
        _hotmart = hotmart;
        _professorService = professorService;
        _usuario = usuario;
    }
    [HttpGet("hotmart")]
    public async Task<IActionResult> GetVendasComStatusCadastro(
    [FromQuery] long? productId = 6420317,
    [FromQuery] string? transactionStatus = " ",
    [FromQuery] DateTime? from = null,
    [FromQuery] DateTime? to = null)
    {
        try
        {
            var vendas = await _hotmart.GetVendasAsync(productId, transactionStatus, from, to);

            if (!vendas.Any())
            {
                return Ok(new
                {
                    total = 0,
                    cadastrados = 0,
                    naoCadastrados = 0,
                    data = new List<object>()
                });
            }

            // Extrai e-mails únicos
            var emailsCompradores = vendas.Select(v => v.BuyerEmail).ToList();

            // Verifica quem já está cadastrado como professor
            var statusCadastro = await _professorService.VerificarEmailsCadastradosComoProfessorAsync(emailsCompradores);

            var professores = await _professorService.BuscarViaEmail(statusCadastro);


            var vendasComStatus = vendas
                .OrderByDescending(v => v.CreatedDate)
                .Select(v =>
                {
                    var jaCadastrado = statusCadastro.GetValueOrDefault(v.BuyerEmail, false);

                    professores.TryGetValue(v.BuyerEmail, out var professor);

                    return new
                    {
                        v.Transaction,
                        v.Status,
                        v.ProductId,
                        v.ProductName,
                        v.BuyerEmail,
                        v.BuyerName,
                        v.TotalValue,
                        v.CreatedDate,

                        JaCadastradoComoProfessor = jaCadastrado,

                        StatusCadastro = jaCadastrado ? "Já cadastrado na plataforma" : "Ainda não cadastrado",

                        NomeCompleto = jaCadastrado ? professor?.NomeCompleto : null,
                        Telefone = jaCadastrado ? professor?.Telefone : null,
                        NivelEnsino = jaCadastrado ? professor?.NivelEnsino : null,
                        ProfessorId = jaCadastrado ? professor?.ProfessorId : null,
                        Ativo = jaCadastrado ? professor?.Ativo : null,
                        Roles = jaCadastrado ? professor?.Roles : null
                    };
                }).ToList();

            var total = vendasComStatus.Count;
            var cadastrados = vendasComStatus.Count(v => v.JaCadastradoComoProfessor);
            var naoCadastrados = total - cadastrados;

            return Ok(new
            {
                total,
                cadastrados,
                naoCadastrados,
                data = vendasComStatus
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { erro = "Falha ao verificar cadastros", detalhe = ex.Message });
        }
    }
}

