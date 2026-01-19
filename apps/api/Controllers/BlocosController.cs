namespace api.Controllers;
using api.Models;
using api.Services;
using Data;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;

using Microsoft.EntityFrameworkCore;
using api.DTOs.Bloco;

[Route("api/[controller]")]
    [ApiController]
    public class BlocosController : ControllerBase
    {
        private readonly AppDbContext _context;

        public BlocosController(AppDbContext context)
        {
            _context = context;
        }

        // Listagem com paginação, busca por título e filtro por status
        [HttpGet]
        public async Task<IActionResult> GetBlocos(string? busca = null, bool? ativo = null, int page = 1, int pageSize = 10)
        {
            var query = _context.Blocos.AsQueryable();

            // Filtro por título (busca)
            if (!string.IsNullOrEmpty(busca))
            {
                query = query.Where(b => b.Titulo.Contains(busca));
            }

            // Filtro por status (ativo/inativo)
            if (ativo.HasValue)
            {
                query = query.Where(b => b.Status == ativo.Value);
            }

            // Contar quantidade de atividades via query (alternativa ao virtual)
            // Se usar isso, remova a prop virtual do model e use Select para projetar
            var blocos = await query
                .Select(b => new
                {
                    b.Id,
                    b.Titulo,
                    b.Ordem,
                    b.Observacao,
                    b.CreatedAt,
                    b.UpdatedAt,
                    b.Status,
                    b.Icone,
                   // QuantidadeAtividades = b.Atividades.Count() // Conta via query EF
                })
                .OrderBy(b => b.Ordem) // Ordena por ordem
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            var total = await query.CountAsync();

            return Ok(new { Total = total, Blocos = blocos });
        }

    // Criar
    [HttpPost]
    public async Task<IActionResult> CreateBloco([FromBody] BlocoCreateDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var bloco = new Bloco
        {
            Titulo = dto.Titulo,
            Ordem = dto.Ordem,
            Observacao = dto.Observacao,
            Status = dto.Status,
            Icone = dto.Icone,

        };

        _context.Blocos.Add(bloco);
        await _context.SaveChangesAsync();

        // Retorna o bloco criado (você pode usar um DTO de saída se quiser)
        return CreatedAtAction(nameof(GetBlocoById), new { id = bloco.Id }, bloco);
    }

    // Editar
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateBloco(int id, [FromBody] BlocoUpdateDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var bloco = await _context.Blocos.FindAsync(id);
        if (bloco == null)
            return NotFound();

        // Atualiza apenas os campos permitidos
        bloco.Titulo = dto.Titulo;
        bloco.Ordem = dto.Ordem;
        bloco.Observacao = dto.Observacao;
        bloco.Status = dto.Status;
        bloco.Icone = dto.Icone;
        bloco.UpdatedAt = DateTime.UtcNow;

        // Importante: NÃO tocamos na coleção Atividades aqui
        // Ela só deve ser modificada pelos endpoints próprios de Atividades

        await _context.SaveChangesAsync();

        return NoContent();
    }

    // Excluir (soft delete - marca como inativo)
    [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteBloco(int id)
        {
            var bloco = await _context.Blocos.FindAsync(id);
            if (bloco == null) return NotFound();

            bloco.Status = false; // Soft delete (muda status para inativo)
            // Para hard delete: _context.Blocos.Remove(bloco);

            await _context.SaveChangesAsync();

            return NoContent();
        }

        // Método auxiliar para GET por ID (opcional, mas útil)
        [HttpGet("{id}")]
        public async Task<IActionResult> GetBlocoById(int id)
        {
            var bloco = await _context.Blocos
                .Select(b => new
                {
                    b.Id,
                    b.Titulo,
                    b.Ordem,
                    b.Observacao,
                    b.CreatedAt,
                    b.UpdatedAt,
                    b.Status,
                    b.Icone,
                //    QuantidadeAtividades = b.Atividades.Count()
                })
                .FirstOrDefaultAsync(b => b.Id == id);

            if (bloco == null) return NotFound();

            return Ok(bloco);
        }
    }

