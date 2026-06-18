using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace api.Migrations
{
    /// <inheritdoc />
    public partial class AddAlunoAtendimentoEPerfilPedagogico : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateOnly>(
                name: "datanascimento",
                table: "alunos",
                type: "date",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "diassemanaatendimentojson",
                table: "alunos",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "duracaoatendimentominutos",
                table: "alunos",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "frequenciasemanalatendimento",
                table: "alunos",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "perfilpedagogiconecessidades",
                table: "alunos",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "perfilpedagogicopotencialidades",
                table: "alunos",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "tipoatendimentoaee",
                table: "alunos",
                type: "integer",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "datanascimento",
                table: "alunos");

            migrationBuilder.DropColumn(
                name: "diassemanaatendimentojson",
                table: "alunos");

            migrationBuilder.DropColumn(
                name: "duracaoatendimentominutos",
                table: "alunos");

            migrationBuilder.DropColumn(
                name: "frequenciasemanalatendimento",
                table: "alunos");

            migrationBuilder.DropColumn(
                name: "perfilpedagogiconecessidades",
                table: "alunos");

            migrationBuilder.DropColumn(
                name: "perfilpedagogicopotencialidades",
                table: "alunos");

            migrationBuilder.DropColumn(
                name: "tipoatendimentoaee",
                table: "alunos");
        }
    }
}
