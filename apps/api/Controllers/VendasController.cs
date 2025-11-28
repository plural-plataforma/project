using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/vendas")]
public class VendasController : ControllerBase
{
    private readonly HotmartService _hotmart;

    public VendasController(HotmartService hotmart) => _hotmart = hotmart;

    [HttpGet("hotmart")]
    public async Task<IActionResult> Get(
    [FromQuery] long? productId = null,
    [FromQuery] string? transactionStatus = "",
    [FromQuery] DateTime? from = null,
    [FromQuery] DateTime? to = null)
    {
        var vendas = await _hotmart.GetVendasAsync(productId, transactionStatus, from, to);
        return Ok(vendas);
    }
}

