namespace api.Controllers;
using api.DTOs.Atividade;
using api.DTOs.Bloco;
using api.Models;
using api.Responses;
using api.Services;
using Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using System.Threading.Tasks;

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

        if (!string.IsNullOrEmpty(busca))
            query = query.Where(b => b.Titulo.Contains(busca));

        if (ativo.HasValue)
            query = query.Where(b => b.Status == ativo.Value);

        var blocos = await query
            .OrderBy(b => b.Ordem)
            .ThenBy(b => b.Titulo)
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
                QuantidadeAtividades = b.Atividades.Count()
            })
            .ToListAsync();  // ← sem Skip/Take = retorna tudo

        return Ok(blocos);
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

    // Retorna todos os blocos ativos com todas as suas atividades ativas
    [HttpGet("com-atividades")]
    public async Task<IActionResult> GetBlocosComAtividades()
    {
        var blocos = await _context.Blocos
            .Where(b => b.Status)
            .OrderBy(b => b.Ordem)
            .Select(b => new BlocoComAtividadesDTO
            {
                Id = b.Id,
                Titulo = b.Titulo,
                Ordem = b.Ordem,
                Observacao = b.Observacao,
                Icone = b.Icone,
                QuantidadeAtividades = b.Atividades.Count(a => a.Ativo),
                Atividades = b.Atividades
                    .Where(a => a.Ativo)
                    .Select(a => new AtividadeBuscarDTO
                    {
                        Id = a.Id,
                        Titulo = a.Titulo,
                        Enunciado = a.Enunciado,
                        BlocoId = a.BlocoId,
                        Nivel = a.Nivel.ToString(),
                        EtapaMin = a.EtapaMin,
                        EtapaMax = a.EtapaMax,
                        ImagemUrl = a.ImagemUrl,
                        Ativo = a.Ativo,
                        HabilidadeIds = a.Habilidades.Select(h => h.Id).ToList()
                    })
                    .OrderBy(a => a.Titulo) // ou .OrderBy(a => a.Id) se preferir por ordem de inserção
                    .ToList()
            })
            .ToListAsync();

        // Opcional: filtrar apenas blocos que têm pelo menos uma atividade ativa
        // var blocosComAtividades = blocos.Where(b => b.QuantidadeAtividades > 0).ToList();
        // if (!blocosComAtividades.Any()) return NotFound("Nenhum bloco com atividades encontrado.");

        return Ok(blocos);
    }
}

