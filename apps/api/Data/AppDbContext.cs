using api.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace Data
{
 public class AppDbContext : IdentityDbContext<Usuario>
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


            //Garantir que todas as tabelas do banco sejam criadas com nomes em minúsculas conforme o padrão do PostgreSQL
            foreach (var entidade in modelBuilder.Model.GetEntityTypes())
            {
                entidade.SetTableName(entidade.GetTableName().ToLower());

                foreach (var propriedade in entidade.GetProperties())
                {
                    propriedade.SetColumnName(propriedade.GetColumnName().ToLower());
                }

                foreach (var chavePrimaria in entidade.GetKeys())
                {
                    chavePrimaria.SetName(chavePrimaria.GetName().ToLower());
                }

                foreach (var chaveEstrangeira in entidade.GetForeignKeys())
                {
                    chaveEstrangeira.SetConstraintName(chaveEstrangeira.GetConstraintName().ToLower());
                }

                foreach (var indice in entidade.GetIndexes())
                {
                    indice.SetDatabaseName(indice.GetDatabaseName().ToLower());
                }
            }


            // Relacionamento N:N entre Escola e Professor para que crie uma tabela de junção
            modelBuilder.Entity<Escola>()
          .HasMany(e => e.Professores)
          .WithMany(p => p.Escolas) 
          .UsingEntity(j => j.ToTable("escolasxprofessores"));

            modelBuilder.Entity<Usuario>().HasOne(u => u.Professor)
                .WithMany()
                .HasForeignKey(u => u.ProfessorId)
                .OnDelete(DeleteBehavior.Restrict);

  }

 }
}
