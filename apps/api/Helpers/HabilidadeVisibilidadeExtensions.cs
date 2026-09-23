using api.Models;

namespace api.Helpers;

public static class HabilidadeVisibilidadeExtensions
{
    /// <summary>Habilidades globais (IdProfessor nulo) mais as próprias da professora.</summary>
    public static IQueryable<Habilidade> VisiveisParaProfessor(this IQueryable<Habilidade> consulta, int? professorId)
    {
        return consulta.Where(h => h.IdProfessor == null || h.IdProfessor == professorId);
    }
}
