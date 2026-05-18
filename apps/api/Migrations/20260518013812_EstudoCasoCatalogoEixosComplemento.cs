using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace api.Migrations
{
    /// <inheritdoc />
    public partial class EstudoCasoCatalogoEixosComplemento : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                INSERT INTO estudo_caso_eixos_catalogo (codigo, rotulo, descricaohint, ordemexibicao) VALUES
                ('SAUDE_BEMESTAR', 'Saúde e bem-estar', 'Condicionantes físicos, sono, alimentação e ausências por saúde quando pertinentes ao caso.', 7),
                ('SENSORIAL', 'Sensorial e percepção', 'Audição, visão, vestibular, tátil e integração sensorial no contexto escolar.', 8),
                ('MOTRICIDADE', 'Motricidade e esquema corporal', 'Coordenação fina e grossa, postura, grafomotricidade e deslocamento.', 9),
                ('TRANSICAO_VIDA', 'Transição e projeto de vida', 'Etapas escolares futuras, trabalho, vida adulta e articulação com rede de apoio.', 10),
                ('ACESSIBILIDADE', 'Barreiras e acessibilidade no ambiente', 'Física, comunicacional, pedagógica e atitudinal — inclui uso de recursos e TA quando aplicável.', 11)
                ON CONFLICT (codigo) DO NOTHING;
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                DELETE FROM estudo_caso_eixos_catalogo
                WHERE codigo IN (
                  'SAUDE_BEMESTAR', 'SENSORIAL', 'MOTRICIDADE', 'TRANSICAO_VIDA', 'ACESSIBILIDADE'
                )
                AND NOT EXISTS (
                  SELECT 1 FROM estudo_caso_itens_eixo i WHERE i.eixocatalogoid = estudo_caso_eixos_catalogo.id
                );
                """);
        }
    }
}
