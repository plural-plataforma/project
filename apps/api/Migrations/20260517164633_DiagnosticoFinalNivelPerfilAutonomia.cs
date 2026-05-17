using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace api.Migrations
{
    /// <inheritdoc />
    public partial class DiagnosticoFinalNivelPerfilAutonomia : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "nivelperfilautonomia",
                table: "diagnosticos_finais",
                type: "character varying(40)",
                maxLength: 40,
                nullable: true);

            migrationBuilder.Sql("""
                UPDATE diagnosticos_finais
                SET nivelperfilautonomia = CASE
                    WHEN percentualautonomia < 34 THEN 'PredominioDependencia'
                    WHEN percentualautonomia < 67 THEN 'AutonomiaMediada'
                    ELSE 'PredominioAutonomia'
                END
                WHERE nivelperfilautonomia IS NULL;
                """);

            migrationBuilder.Sql("""
                UPDATE diagnosticos_finais
                SET nivelperfilautonomia = 'NaoAvaliado'
                WHERE nivelperfilautonomia IS NULL;
                """);

            migrationBuilder.AlterColumn<string>(
                name: "nivelperfilautonomia",
                table: "diagnosticos_finais",
                type: "character varying(40)",
                maxLength: 40,
                nullable: false,
                defaultValue: "NaoAvaliado");

            migrationBuilder.DropColumn(
                name: "percentualautonomia",
                table: "diagnosticos_finais");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<double>(
                name: "percentualautonomia",
                table: "diagnosticos_finais",
                type: "double precision",
                nullable: false,
                defaultValue: 0.0);

            migrationBuilder.Sql("""
                UPDATE diagnosticos_finais
                SET percentualautonomia = CASE nivelperfilautonomia
                    WHEN 'PredominioDependencia' THEN 20
                    WHEN 'AutonomiaMediada' THEN 50
                    WHEN 'PredominioAutonomia' THEN 80
                    ELSE 0
                END;
                """);

            migrationBuilder.DropColumn(
                name: "nivelperfilautonomia",
                table: "diagnosticos_finais");
        }
    }
}
