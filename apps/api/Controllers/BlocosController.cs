namespace api.Controllers;
using api.Models;
using api.Services;
using Data;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;

using Microsoft.EntityFrameworkCore;

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
        public async Task<IActionResult> CreateBloco([FromBody] Bloco bloco)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            _context.Blocos.Add(bloco);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetBlocoById), new { id = bloco.Id }, bloco);
        }

        // Editar
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateBloco(int id, [FromBody] Bloco bloco)
        {
            if (id != bloco.Id) return BadRequest();

            var existing = await _context.Blocos.FindAsync(id);
            if (existing == null) return NotFound();

            // Atualize campos (exclua ID e datas automáticas se necessário)
            existing.Titulo = bloco.Titulo;
            existing.Ordem = bloco.Ordem;
            existing.Observacao = bloco.Observacao;
            existing.Status = bloco.Status;
            existing.Icone = bloco.Icone;
            existing.UpdatedAt = DateTime.UtcNow;

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

