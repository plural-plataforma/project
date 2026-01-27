namespace api.DTOs.Bloco
{
    public class BlocoAtualizarDTO : BlocoCadastroDTO
    {
        public int Id { get; set; }
        public bool? Status { get; set; }     
        public int? Ordem { get; set; }
    }
}
