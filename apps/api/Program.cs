using System.ComponentModel;
using DotNetEnv;
using System.Text;
using api.Models;
using api.Services;
using Data;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowLocalhost", policy =>
    {
        policy.WithOrigins(
                "http://localhost:8081",
                "https://68ef01c7dc34b7e24e5960cb--leafy-donut-4f71a4.netlify.app",
                "https://leafy-donut-4f71a4.netlify.app",
                "https://devs.pluralplataforma.com",
                "http://localhost:8082")
            .AllowAnyHeader() 
            .AllowAnyMethod()
            .AllowCredentials(); 
    });
});


// Carrega .env da raiz do Turborepo
Env.TraversePath().Load();
builder.Configuration.AddEnvironmentVariables();

// Validações básicas das vars do .env
var dbPassword = builder.Configuration["DB_PASSWORD"] ?? throw new InvalidOperationException("DB_PASSWORD não encontrada no .env");
var userId = builder.Configuration["USER_ID"] ?? throw new InvalidOperationException("USER_ID não encontrada no .env");
var serverUrl = builder.Configuration["SERVER_URL"] ?? throw new InvalidOperationException("SERVER_URL não encontrada no .env");
var jwtSecret = builder.Configuration["JWT_SECRET"] ?? throw new InvalidOperationException("JWT_SECRET não encontrada no .env");

// Carrega appsettings.json e substitui placeholders
builder.Configuration.AddJsonFile("appsettings.json", optional: false, reloadOnChange: true);
var appSettings = builder.Configuration.GetSection("JwtSettings");
var secret = appSettings["Secret"].Replace("{JWT_SECRET}", jwtSecret); // Substitui o placeholder
appSettings["Secret"] = secret; // Atualiza a configuração

// Monte connection string com substituições do .env
var baseConnectionString = builder.Configuration.GetConnectionString("AppDbContext")
    ?? throw new InvalidOperationException("AppDbContext não encontrada no appsettings.json");
var connectionString = baseConnectionString
    .Replace("{USER_ID}", userId)
    .Replace("{DB_PASSWORD}", dbPassword)
    .Replace("{SERVER_URL}", serverUrl);

// Registra DbContext com a string montada
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString));

// Identity
builder.Services.AddIdentity<Usuario, IdentityRole>().AddEntityFrameworkStores<AppDbContext>()
    .AddDefaultTokenProviders();

var chave = Encoding.ASCII.GetBytes(builder.Configuration["JwtSettings:Secret"]);

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
}).AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(chave),
        ValidateIssuer = true,
        ValidIssuer = builder.Configuration["JwtSettings:Issuer"],
        ValidateAudience = true,
        ValidAudience = builder.Configuration["JwtSettings:Audience"],
    };
});

// Add services to the container.
builder.Services.AddScoped<AutenticacaoService>();
builder.Services.AddScoped<ProfessorService>();
builder.Services.AddScoped<EscolaService>();
builder.Services.AddScoped<AlunoService>();
builder.Services.AddScoped<HabilidadeService>();
builder.Services.AddScoped<PlanejamentoService>();
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(x =>
{
    x.SwaggerDoc("v1", new OpenApiInfo { Title = "Plural API", Version = "v1" });
    x.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer",
        In = ParameterLocation.Header,
        Description = "Insira o token JWT no formato: 'Bearer {seu token aqui}'"
    });
});

var app = builder.Build();

// Pipeline
if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
    app.UseExceptionHandler("/Home/Error");
    app.UseHsts();
}
else
{
    app.UseSwagger();
    app.UseSwaggerUI(x =>
    {
        x.SwaggerEndpoint("swagger/v1/swagger.json", "Plural API");
        x.RoutePrefix = string.Empty;
    });
}

app.UseRouting();
app.UseCors("AllowLocalhost");
app.UseAuthentication();
app.UseAuthorization();

app.MapStaticAssets(); // Se customizado, ok

app.MapControllers();

// Check de conexão (melhorado)
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

    try
    {
        context.Database.CanConnect();
        Console.WriteLine("Conexão com o banco de dados estabelecida com sucesso.");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Erro ao conectar ao banco de dados: {ex.Message}");
    }
}

app.Run();