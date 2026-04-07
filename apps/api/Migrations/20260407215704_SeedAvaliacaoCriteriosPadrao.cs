using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace api.Migrations
{
    /// <inheritdoc />
    public partial class SeedAvaliacaoCriteriosPadrao : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Só insere critérios padrão se a tabela estiver vazia (evita duplicar em re-deploy).
            migrationBuilder.Sql("""
                INSERT INTO avaliacao (descricao, resumo, ativo)
                SELECT d, r, a
                FROM (VALUES
                  ('Portfólio do aluno', 'Evidências de aprendizagem organizadas no período.', true),
                  ('Participação', 'Engajamento nas atividades propostas.', true),
                  ('Produção escrita', 'Registros e produções textuais individuais.', true)
                ) AS t(d, r, a)
                WHERE NOT EXISTS (SELECT 1 FROM avaliacao LIMIT 1);
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
        }
    }
}
