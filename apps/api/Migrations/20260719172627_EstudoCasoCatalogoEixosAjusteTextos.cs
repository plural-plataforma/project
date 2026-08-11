using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace api.Migrations
{
    /// <inheritdoc />
    public partial class EstudoCasoCatalogoEixosAjusteTextos : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                UPDATE estudo_caso_eixos_catalogo SET descricaohint = 'Compreensão, expressão oral e escrita; uso de comunicação aumentativa e alternativa quando aplicável.' WHERE codigo = 'COMUNICACAO';
                UPDATE estudo_caso_eixos_catalogo SET descricaohint = 'Acesso ao currículo por meio de adaptações razoáveis e recursos de acessibilidade.' WHERE codigo = 'CURRICULO';
                UPDATE estudo_caso_eixos_catalogo SET descricaohint = 'Física, comunicacional, pedagógica e atitudinal — inclui uso de recursos e Tecnologia Assistiva quando aplicável.' WHERE codigo = 'ACESSIBILIDADE';
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                UPDATE estudo_caso_eixos_catalogo SET descricaohint = 'Compreensão, expressão oral e escrita; uso de AAC quando aplicável.' WHERE codigo = 'COMUNICACAO';
                UPDATE estudo_caso_eixos_catalogo SET descricaohint = 'Acesso ao currículo com adaptações razoáveis e CMLO.' WHERE codigo = 'CURRICULO';
                UPDATE estudo_caso_eixos_catalogo SET descricaohint = 'Física, comunicacional, pedagógica e atitudinal — inclui uso de recursos e TA quando aplicável.' WHERE codigo = 'ACESSIBILIDADE';
                """);
        }
    }
}
