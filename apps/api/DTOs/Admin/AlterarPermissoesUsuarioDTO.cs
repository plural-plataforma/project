using System.ComponentModel.DataAnnotations;

namespace api.DTOs.Admin
{
    public class AlterarPermissoesUsuarioDTO
    {

        [Required]
        public long IdUsuario { get; set; }

        public List<string> AdicionarPermissoes { get; set; }

        public List<string> RemoverPermissoes { get; set; }
    }
}
