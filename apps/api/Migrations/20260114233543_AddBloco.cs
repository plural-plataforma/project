using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace api.Migrations
{
    /// <inheritdoc />
    public partial class AddBloco : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "bloco",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    titulo = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    ordem = table.Column<int>(type: "integer", nullable: false),
                    observacao = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    createdat = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updatedat = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    status = table.Column<bool>(type: "boolean", nullable: false),
                    icone = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_bloco", x => x.id);
                });
        }
    }
}
