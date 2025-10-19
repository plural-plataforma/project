using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace api.Migrations
{
    /// <inheritdoc />
    public partial class ajusteColunaNivelEnsino : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "nivelensino",
                table: "habilidades");

            migrationBuilder.AddColumn<int>(
                name: "idnivelensino",
                table: "habilidades",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "idnivelensino",
                table: "habilidades");

            migrationBuilder.AddColumn<string>(
                name: "nivelensino",
                table: "habilidades",
                type: "text",
                nullable: false,
                defaultValue: "");
        }
    }
}
