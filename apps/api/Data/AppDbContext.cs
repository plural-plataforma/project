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
        public DbSet<EscolaXProfessor> EscolasXProfessores { get; set; }

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


            modelBuilder.Entity<EscolaXProfessor>()
          .HasKey(ep => new { ep.EscolaId, ep.ProfessorId });

            modelBuilder.Entity<EscolaXProfessor>()
                .HasOne(ep => ep.Escola)
                .WithMany(e => e.EscolaXProfessores)
                .HasForeignKey(ep => ep.EscolaId);

            modelBuilder.Entity<EscolaXProfessor>()
                .HasOne(ep => ep.Professor)
                .WithMany(p => p.EscolaXProfessores)
                .HasForeignKey(ep => ep.ProfessorId);

            modelBuilder.Entity<Usuario>()
                .HasOne(u => u.Professor)
                .WithMany()
                .HasForeignKey(u => u.ProfessorId)
                .OnDelete(DeleteBehavior.Restrict);

        }

    }
}
