namespace api.DTOs.Atividade
{
    public class AtividadeImagemDTO
    {
        public byte[] Conteudo { get; set; } = [];
        public string ContentType { get; set; } = "image/jpeg";
    }
}
