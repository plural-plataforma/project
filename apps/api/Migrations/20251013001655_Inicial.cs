using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace api.Migrations
{
    /// <inheritdoc />
    public partial class Inicial : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "aspnetroles",
                columns: table => new
                {
                    id = table.Column<string>(type: "text", nullable: false),
                    name = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    normalizedname = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    concurrencystamp = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_aspnetroles", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "escolas",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    nomeinstituicao = table.Column<string>(type: "text", nullable: false),
                    tipo = table.Column<string>(type: "character varying(45)", maxLength: 45, nullable: false),
                    cep = table.Column<string>(type: "character varying(9)", maxLength: 9, nullable: false),
                    logradouro = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    numero = table.Column<int>(type: "integer", nullable: false),
                    complemento = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    bairro = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    estado = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    cidade = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_escolas", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "professores",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    nomecompleto = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    cep = table.Column<string>(type: "character varying(9)", maxLength: 9, nullable: true),
                    logradouro = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    numero = table.Column<int>(type: "integer", nullable: true),
                    complemento = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    bairro = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    estado = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: true),
                    cidade = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: true),
                    telefone = table.Column<string>(type: "text", nullable: true),
                    disciplinas = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    nivelensino = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    sobre = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    foto = table.Column<byte[]>(type: "bytea", nullable: true),
                    sexo = table.Column<string>(type: "character varying(1)", maxLength: 1, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_professores", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "responsaveis",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    nomecompleto = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    cep = table.Column<string>(type: "character varying(9)", maxLength: 9, nullable: false),
                    logradouro = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    numero = table.Column<int>(type: "integer", nullable: false),
                    complemento = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    bairro = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    estado = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    cidade = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    telefone = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_responsaveis", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "aspnetroleclaims",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    roleid = table.Column<string>(type: "text", nullable: false),
                    claimtype = table.Column<string>(type: "text", nullable: true),
                    claimvalue = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_aspnetroleclaims", x => x.id);
                    table.ForeignKey(
                        name: "fk_aspnetroleclaims_aspnetroles_roleid",
                        column: x => x.roleid,
                        principalTable: "aspnetroles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "aspnetusers",
                columns: table => new
                {
                    id = table.Column<string>(type: "text", nullable: false),
                    professorid = table.Column<int>(type: "integer", nullable: true),
                    aceitoutermos = table.Column<bool>(type: "boolean", nullable: false),
                    username = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    normalizedusername = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    email = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    normalizedemail = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    emailconfirmed = table.Column<bool>(type: "boolean", nullable: false),
                    passwordhash = table.Column<string>(type: "text", nullable: true),
                    securitystamp = table.Column<string>(type: "text", nullable: true),
                    concurrencystamp = table.Column<string>(type: "text", nullable: true),
                    phonenumber = table.Column<string>(type: "text", nullable: true),
                    phonenumberconfirmed = table.Column<bool>(type: "boolean", nullable: false),
                    twofactorenabled = table.Column<bool>(type: "boolean", nullable: false),
                    lockoutend = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    lockoutenabled = table.Column<bool>(type: "boolean", nullable: false),
                    accessfailedcount = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_aspnetusers", x => x.id);
                    table.ForeignKey(
                        name: "fk_aspnetusers_professores_professorid",
                        column: x => x.professorid,
                        principalTable: "professores",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "alunos",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    nomecompleto = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    cep = table.Column<string>(type: "character varying(9)", maxLength: 9, nullable: false),
                    logradouro = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    numero = table.Column<int>(type: "integer", nullable: false),
                    complemento = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    bairro = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    estado = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    cidade = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    telefone = table.Column<int>(type: "integer", nullable: false),
                    idresponsavel = table.Column<int>(type: "integer", nullable: false),
                    idprofessor = table.Column<int>(type: "integer", nullable: false),
                    idescola = table.Column<int>(type: "integer", nullable: false),
                    nivelensino = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    ano = table.Column<string>(type: "character varying(45)", maxLength: 45, nullable: false),
                    turno = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_alunos", x => x.id);
                    table.ForeignKey(
                        name: "fk_alunos_escolas_idescola",
                        column: x => x.idescola,
                        principalTable: "escolas",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_alunos_professores_idprofessor",
                        column: x => x.idprofessor,
                        principalTable: "professores",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_alunos_responsaveis_idresponsavel",
                        column: x => x.idresponsavel,
                        principalTable: "responsaveis",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "aspnetuserclaims",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    userid = table.Column<string>(type: "text", nullable: false),
                    claimtype = table.Column<string>(type: "text", nullable: true),
                    claimvalue = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_aspnetuserclaims", x => x.id);
                    table.ForeignKey(
                        name: "fk_aspnetuserclaims_aspnetusers_userid",
                        column: x => x.userid,
                        principalTable: "aspnetusers",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "aspnetuserlogins",
                columns: table => new
                {
                    loginprovider = table.Column<string>(type: "text", nullable: false),
                    providerkey = table.Column<string>(type: "text", nullable: false),
                    providerdisplayname = table.Column<string>(type: "text", nullable: true),
                    userid = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_aspnetuserlogins", x => new { x.loginprovider, x.providerkey });
                    table.ForeignKey(
                        name: "fk_aspnetuserlogins_aspnetusers_userid",
                        column: x => x.userid,
                        principalTable: "aspnetusers",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "aspnetuserroles",
                columns: table => new
                {
                    userid = table.Column<string>(type: "text", nullable: false),
                    roleid = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_aspnetuserroles", x => new { x.userid, x.roleid });
                    table.ForeignKey(
                        name: "fk_aspnetuserroles_aspnetroles_roleid",
                        column: x => x.roleid,
                        principalTable: "aspnetroles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_aspnetuserroles_aspnetusers_userid",
                        column: x => x.userid,
                        principalTable: "aspnetusers",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "aspnetusertokens",
                columns: table => new
                {
                    userid = table.Column<string>(type: "text", nullable: false),
                    loginprovider = table.Column<string>(type: "text", nullable: false),
                    name = table.Column<string>(type: "text", nullable: false),
                    value = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_aspnetusertokens", x => new { x.userid, x.loginprovider, x.name });
                    table.ForeignKey(
                        name: "fk_aspnetusertokens_aspnetusers_userid",
                        column: x => x.userid,
                        principalTable: "aspnetusers",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ix_alunos_idescola",
                table: "alunos",
                column: "idescola");

            migrationBuilder.CreateIndex(
                name: "ix_alunos_idprofessor",
                table: "alunos",
                column: "idprofessor");

            migrationBuilder.CreateIndex(
                name: "ix_alunos_idresponsavel",
                table: "alunos",
                column: "idresponsavel");

            migrationBuilder.CreateIndex(
                name: "ix_aspnetroleclaims_roleid",
                table: "aspnetroleclaims",
                column: "roleid");

            migrationBuilder.CreateIndex(
                name: "rolenameindex",
                table: "aspnetroles",
                column: "normalizedname",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_aspnetuserclaims_userid",
                table: "aspnetuserclaims",
                column: "userid");

            migrationBuilder.CreateIndex(
                name: "ix_aspnetuserlogins_userid",
                table: "aspnetuserlogins",
                column: "userid");

            migrationBuilder.CreateIndex(
                name: "ix_aspnetuserroles_roleid",
                table: "aspnetuserroles",
                column: "roleid");

            migrationBuilder.CreateIndex(
                name: "emailindex",
                table: "aspnetusers",
                column: "normalizedemail");

            migrationBuilder.CreateIndex(
                name: "ix_aspnetusers_professorid",
                table: "aspnetusers",
                column: "professorid");

            migrationBuilder.CreateIndex(
                name: "usernameindex",
                table: "aspnetusers",
                column: "normalizedusername",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "alunos");

            migrationBuilder.DropTable(
                name: "aspnetroleclaims");

            migrationBuilder.DropTable(
                name: "aspnetuserclaims");

            migrationBuilder.DropTable(
                name: "aspnetuserlogins");

            migrationBuilder.DropTable(
                name: "aspnetuserroles");

            migrationBuilder.DropTable(
                name: "aspnetusertokens");

            migrationBuilder.DropTable(
                name: "responsaveis");

            migrationBuilder.DropTable(
                name: "aspnetroles");

            migrationBuilder.DropTable(
                name: "aspnetusers");

            migrationBuilder.DropTable(
                name: "escolas");

            migrationBuilder.DropTable(
                name: "professores");
        }
    }
}
