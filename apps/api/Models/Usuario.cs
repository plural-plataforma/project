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
    }
}
