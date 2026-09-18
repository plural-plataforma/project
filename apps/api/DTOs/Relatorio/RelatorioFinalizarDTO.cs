using System.ComponentModel.DataAnnotations;
using api.Models;

namespace api.DTOs.Relatorio;

public class RelatorioFinalizarDTO
{
    // Nullable + [Required] (diferente do padrão não-nulo usado pelos outros enums desta
    // pasta, ex. RelatorioCadastroDTO.TipoPeriodo): só assim o ModelState rejeita um corpo
    // sem o campo em vez de cair silenciosamente em Topicos (valor 0). A faixa do enum
    // (inteiro fora de 0/1) é validada no service — DataAnnotations não valida isso pra enum.
    [Required]
    public RelatorioFormatoFinal? Formato { get; set; }
}
