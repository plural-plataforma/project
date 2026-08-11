using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace api.Migrations
{
    /// <inheritdoc />
    public partial class AddGeracaoIALog : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "geracao_ia_log",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    professorid = table.Column<int>(type: "integer", nullable: false),
                    tipodocumento = table.Column<int>(type: "integer", nullable: false),
                    documentoid = table.Column<int>(type: "integer", nullable: false),
                    alunoid = table.Column<int>(type: "integer", nullable: true),
                    sucesso = table.Column<bool>(type: "boolean", nullable: false),
                    criadoem = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_geracao_ia_log", x => x.id);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "geracao_ia_log");
        }
    }
}
