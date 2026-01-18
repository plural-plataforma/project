namespace api.DTOs.Atividade
{
    public class AtividadeAtualizarDTO : AtividadeCadastroDTO
    {
        public int Id { get; set; }
        public bool? Ativo { get; set; }
    }
}
