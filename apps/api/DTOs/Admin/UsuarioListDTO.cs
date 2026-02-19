namespace api.DTOs.Admin
{
    public class UsuarioListDTO
    {
        public int idUsuario { get; set; }
        public string NomeCompleto { get; set; }
        public string Email { get; set; }
        public string Telefone { get; set; }

        // Status principais
        public bool Ativo { get; set; }              // vem de Professor.Ativo ou Usuario.IsActive
        public bool IsEmbaixadora { get; set; }
        public bool PossuiLockout { get; set; }      // lockout ativo no Identity
        public string StatusConta { get; set; }     // "Ativa", "Bloqueada", "Expirada", etc.

        // Datas úteis
        public DateTime? DataCadastro { get; set; }
        public DateTime? ExpirationDate { get; set; }

        public List<string> Roles { get; set; } = new List<string>();
    }
}