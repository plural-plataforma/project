using Microsoft.AspNetCore.Identity;

namespace api.Models
{
    public class Usuario : IdentityUser
    {
        public int? ProfessorId { get; set; }
        public Professor Professor { get; set; }

        public bool AceitouTermos { get; set; }

        public bool DeveAlterarSenha { get; set; }

        public bool IsEmbaixadora { get; set; }

        public bool IsActive { get; set; } = true;

        public DateTime? ExpirationDate { get; set; }

        public string? HotmartSubscriberCode { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // "hotmart" (webhook automático), email do admin (cadastro manual pelo painel)
        // ou null (cadastro público pelo site).
        public string? CreatedBy { get; set; }
    }
}
