using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace api.Migrations
{
    /// <inheritdoc />
    public partial class AddCreatedAtCreatedByToUsuario : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Usuários já existentes não têm data real de cadastro — usa a data da migration
            // como aproximação em vez de 0001-01-01 (evita expiração/idade sem sentido em relatórios).
            migrationBuilder.AddColumn<DateTime>(
                name: "createdat",
                table: "aspnetusers",
                type: "timestamp with time zone",
                nullable: false,
                defaultValueSql: "now()");

            migrationBuilder.AddColumn<string>(
                name: "createdby",
                table: "aspnetusers",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "createdat",
                table: "aspnetusers");

            migrationBuilder.DropColumn(
                name: "createdby",
                table: "aspnetusers");
        }
    }
}
