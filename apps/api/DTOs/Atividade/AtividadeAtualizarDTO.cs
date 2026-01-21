using Microsoft.AspNetCore.Mvc;

namespace api.DTOs.Atividade
{
    public class AtividadeAtualizarDTO : AtividadeCadastroDTO
    {
        [FromRoute]
        public int Id { get; set; }
        public bool? Ativo { get; set; }
    }
}
