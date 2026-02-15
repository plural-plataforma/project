using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace api.Migrations
{
    /// <inheritdoc />
    public partial class FixProfessorUsuarioNavigation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_aspnetusers_professores_professorid",
                table: "aspnetusers");

            migrationBuilder.DropIndex(
                name: "ix_aspnetusers_professorid",
                table: "aspnetusers");

            migrationBuilder.CreateIndex(
                name: "ix_aspnetusers_professorid",
                table: "aspnetusers",
                column: "professorid",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "fk_aspnetusers_professores_professorid",
                table: "aspnetusers",
                column: "professorid",
                principalTable: "professores",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_aspnetusers_professores_professorid",
                table: "aspnetusers");

            migrationBuilder.DropIndex(
                name: "ix_aspnetusers_professorid",
                table: "aspnetusers");

            migrationBuilder.CreateIndex(
                name: "ix_aspnetusers_professorid",
                table: "aspnetusers",
                column: "professorid");

            migrationBuilder.AddForeignKey(
                name: "fk_aspnetusers_professores_professorid",
                table: "aspnetusers",
                column: "professorid",
                principalTable: "professores",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
