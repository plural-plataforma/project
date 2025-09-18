using api.Models;
using Microsoft.EntityFrameworkCore;

namespace Data
{
 public class AppDbContext : DbContext
 {
  public AppDbContext(DbContextOptions<AppDbContext> options)
      : base(options) { }

  public DbSet<Escola> Escolas { get; set; }
  public DbSet<Professor> Professores { get; set; }
  public DbSet<Aluno> Alunos { get; set; }
  public DbSet<Responsavel> Responsaveis { get; set; }


  protected override void OnModelCreating(ModelBuilder modelBuilder)
  {
      base.OnModelCreating(modelBuilder);

            // Relacionamento N:N entre Escola e Professor para que crie uma tabela de junção
            modelBuilder.Entity<Escola>()
          .HasMany(e => e.Professores)
          .WithMany(p => p.Escolas) 
          .UsingEntity(j => j.ToTable("EscolasxProfessores"));
  }

 }
}
