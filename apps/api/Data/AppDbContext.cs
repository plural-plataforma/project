using api.Models;
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
        public DbSet<Habilidade> Habilidades { get; set; }
        public DbSet<Planejamento> Planejamentos { get; set; }
        public DbSet<AlunosXPlanejamento> AlunosXPlanejamentos { get; set; }
        public DbSet<HabilidadesXPlanejamento> HabilidadesXPlanejamentos { get; set; }

        public DbSet<Laudo> Laudos { get; set; }

        public DbSet<Estrategias> Estrategias { get; set; }
        public DbSet<EstrategiasXPlanejamento> EstrategiasXPlanejamentos { get; set; }
        public DbSet<Avaliacao> Avaliacao { get; set; }
        public DbSet<AvaliacaoXPlanejamento> AvaliacaoXPlanejamento { get; set; }
        public DbSet<Bloco> Blocos { get; set; }
        public DbSet<Atividade> Atividades { get; set; }
        public DbSet<AvaliacaoDiagnostica> AvaliacoesDiagnosticas { get; set; }
        public DbSet<AvaliacaoDiagnosticaBloco> AvaliacoesDiagnosticasBlocos { get; set; }
        public DbSet<AvaliacaoDiagnosticaAtividade> AvaliacoesDiagnosticasAtividades { get; set; } = null!;
        public DbSet<AvaliacaoAluno> AvaliacoesAlunos { get; set; }
        public DbSet<DesempenhoAtividade> DesempenhosAtividades { get; set; }
        public DbSet<ObservacaoAlunoAvaliacaoHistorico> ObservacoesAlunosAvaliacaoHistorico { get; set; }
        public DbSet<DiagnosticoFinal> DiagnosticosFinais { get; set; }


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
                .WithOne(p => p.Usuario)
                .HasForeignKey<Usuario>(u => u.ProfessorId)
                .OnDelete(DeleteBehavior.Cascade);

            // Planejamento ↔ Habilidade (N:N)
            modelBuilder.Entity<HabilidadesXPlanejamento>()
                .HasKey(ph => new { ph.PlanejamentoId, ph.HabilidadeId });

            modelBuilder.Entity<HabilidadesXPlanejamento>()
                .HasOne(ph => ph.Planejamento)
                .WithMany(p => p.HabilidadesXPlanejamentos)
                .HasForeignKey(ph => ph.PlanejamentoId);

            modelBuilder.Entity<HabilidadesXPlanejamento>()
                .HasOne(ph => ph.Habilidade)
                .WithMany(h => h.HabilidadesXPlanejamentos)
                .HasForeignKey(ph => ph.HabilidadeId);

            // Planejamento ↔ Estrategia (N:N)
            modelBuilder.Entity<EstrategiasXPlanejamento>()
                .HasKey(ph => new { ph.PlanejamentoId, ph.EstrategiaId });

            modelBuilder.Entity<EstrategiasXPlanejamento>()
                .HasOne(ph => ph.Planejamento)
                .WithMany(p => p.EstrategiasXPlanejamentos)
                .HasForeignKey(ph => ph.PlanejamentoId);

            modelBuilder.Entity<EstrategiasXPlanejamento>()
                .HasOne(ph => ph.Estrategia)
                .WithMany(h => h.EstrategiasXPlanejamentos)
                .HasForeignKey(ph => ph.EstrategiaId);


            // Planejamento ↔ Avaliacao (N:N)
            modelBuilder.Entity<AvaliacaoXPlanejamento>()
                .HasKey(ph => new { ph.PlanejamentoId, ph.AvaliacaoId });

            modelBuilder.Entity<AvaliacaoXPlanejamento>()
                .HasOne(ph => ph.Planejamento)
                .WithMany(p => p.AvaliacaoXPlanejamentos)
                .HasForeignKey(ph => ph.PlanejamentoId);

            modelBuilder.Entity<AvaliacaoXPlanejamento>()
                .HasOne(ph => ph.Avaliacao)
                .WithMany(h => h.AvaliacaoXPlanejamento)
                .HasForeignKey(ph => ph.AvaliacaoId);

            // Planejamento ↔ Aluno (N:N)
            modelBuilder.Entity<AlunosXPlanejamento>()
                .HasKey(pa => new { pa.PlanejamentoId, pa.AlunoId });

            modelBuilder.Entity<AlunosXPlanejamento>()
                .HasOne(pa => pa.Planejamento)
                .WithMany(p => p.AlunosXPlanejamentos)
                .HasForeignKey(pa => pa.PlanejamentoId);

            modelBuilder.Entity<AlunosXPlanejamento>()
                .HasOne(pa => pa.Aluno)
                .WithMany(a => a.AlunosXPlanejamentos)
                .HasForeignKey(pa => pa.AlunoId);

            // Bloco ↔ Atividade (1:N)
            modelBuilder.Entity<Bloco>()
              .HasMany(b => b.Atividades)           // Um Bloco tem muitas Atividades
              .WithOne(a => a.Bloco)                // Cada Atividade tem um Bloco
              .HasForeignKey(a => a.BlocoId)        // Nome da coluna FK na tabela Atividades
              .OnDelete(DeleteBehavior.Restrict);

            // Atividade
            modelBuilder.Entity<Atividade>()
                .Property(a => a.Nivel)
                .HasConversion<string>();

            modelBuilder.Entity<Atividade>()
                .Property(a => a.BlocoId)
                .IsRequired();

            modelBuilder.Entity<Atividade>()
                .HasMany(a => a.Habilidades)
                .WithMany(h => h.Atividades) // Opcional: adicione ICollection<Atividade> Atividades no model Habilidade
                .UsingEntity<Dictionary<string, object>>(
                    "AtividadeHabilidade",
                    j => j.HasOne<Habilidade>().WithMany().HasForeignKey("HabilidadeId"),
                    j => j.HasOne<Atividade>().WithMany().HasForeignKey("AtividadeId"),
                    j => j.ToTable("AtividadeHabilidade")

                );
            modelBuilder.Entity<AvaliacaoDiagnostica>()
                .HasOne(a => a.Escola)
                .WithMany()
                .HasForeignKey(a => a.EscolaId)
                .IsRequired(false) 
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<AvaliacaoDiagnosticaBloco>()
                .HasKey(ab => new { ab.AvaliacaoDiagnosticaId, ab.BlocoId });

            modelBuilder.Entity<AvaliacaoDiagnosticaAtividade>()
               .HasKey(ab => new { ab.AvaliacaoDiagnosticaId, ab.AtividadeId });

            modelBuilder.Entity<AvaliacaoAluno>()
                .HasKey(aa => new { aa.AvaliacaoDiagnosticaId, aa.AlunoId });

            modelBuilder.Entity<AvaliacaoAluno>()
                .Property(aa => aa.ObservacaoGeral)
                .HasColumnType("text");

            modelBuilder.Entity<DesempenhoAtividade>()
                .HasIndex(d => new { d.AvaliacaoDiagnosticaId, d.AlunoId, d.AtividadeId });

            modelBuilder.Entity<DesempenhoAtividade>()
                .HasIndex(d => new { d.AvaliacaoDiagnosticaId, d.DataRegistro });

            modelBuilder.Entity<ObservacaoAlunoAvaliacaoHistorico>()
                .HasIndex(o => new { o.AvaliacaoDiagnosticaId, o.AlunoId, o.DataRegistro });

        }

    }
}
