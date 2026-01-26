using Microsoft.EntityFrameworkCore.Migrations;
using System.ComponentModel.DataAnnotations.Schema;

#nullable disable

namespace api.Migrations
{
    /// <inheritdoc />
    public partial class AlterBlocos : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {

        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {

        }
    }

    public class Bloco
    {
        public int Id { get; set; }
        public string Nome { get; set; } = null!;
        public string? Cor { get; set; }

        [ForeignKey("Bloco")]
        public int BlocoId { get; set; }
    }
}
