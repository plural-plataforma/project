// api.DTOs.Admin/AtualizarStatusUsuarioDTO.cs
using System.ComponentModel.DataAnnotations;
using System;

namespace api.DTOs.Admin
{
    public class AtualizarStatusUsuarioDTO
    {
        [Required(ErrorMessage = "O ID do usuário (Professor) é obrigatório")]
        public int IdUsuario { get; set; }

        // Ação opcional agora (pode usar IsActive em vez disso)
        [RegularExpression("^[AI]$", ErrorMessage = "Ação deve ser 'A' (Ativar) ou 'I' (Inativar)")]
        public string? Acao { get; set; }

        public string? Nome { get; set; }

        [EmailAddress(ErrorMessage = "E-mail inválido")]
        public string? Email { get; set; }

        public string? Telefone { get; set; }

        public bool? IsActive { get; set; }

        public DateTime? ExpirationDate { get; set; }  // null = vitalício

        public bool? IsEmbaixadora { get; set; }

        public string[]? RolesAdicionar { get; set; }

        public string[]? RolesRemover { get; set; }
    }
}