namespace api.DTOs.Professor
{
    public class ProfessorViaEmailDTO
    {
        public string Email { get; set; }
        public int ProfessorId { get; set; }
        public string NomeCompleto { get; set; }
        public string NivelEnsino { get; set; }
        public bool Ativo { get; set; }
        public List<string> Roles { get; set; }
    }
}
