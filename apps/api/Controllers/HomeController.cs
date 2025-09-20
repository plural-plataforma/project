using System.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using api.Models;

namespace api.Controllers;

[ApiController]
[Route("[controller]")]
public class HomeController : Controller
{
    private readonly ILogger<HomeController> _logger;

    public HomeController(ILogger<HomeController> logger)
    {
        _logger = logger;
    }


    // GET /home
    /// <summary>
    /// Retorna uma mensagem de teste.
    /// </summary>
    /// <returns>PrimeiroEndpoint</returns>
    [HttpGet]
    public IActionResult Get()
    {
        return Ok("PrimeiroEndpoint");
    }
}
