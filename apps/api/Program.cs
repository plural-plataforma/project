using DotNetEnv;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;
using api.Models;
using api.Services;
using Data;
using QuestPDF.Infrastructure;


QuestPDF.Settings.License = LicenseType.Community;

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
                "http://localhost:8082",
                "https://adm.pluralplataforma.com",
                "https://app-web-iota-ten.vercel.app",
                "178.63.129.220:443",
                "https://app-web-dev.vercel.app",
                "https://app.pluralplataforma.com")
            .AllowAnyHeader() 
            .AllowAnyMethod()
            .AllowCredentials(); 
    });

    // Política separada (sem AllowCredentials) para endpoints públicos consumidos
    // pelas landing pages — não usam cookies/sessão, só leitura de dados públicos.
    options.AddPolicy("AllowPublicSites", policy =>
    {
        policy.WithOrigins(
                "https://pluralplataforma.com",
                "https://www.pluralplataforma.com",
                "https://morganadacruz.com.br",
                "https://www.morganadacruz.com.br",
                "http://localhost:3000",
                "http://localhost:3001")
            .AllowAnyHeader()
            .WithMethods("GET");
    });
});


// Carrega .env da raiz do Turborepo
DotNetEnv.Env.TraversePath().Load();

// Adiciona variáveis de ambiente (sobrescreve placeholders)
builder.Configuration.AddEnvironmentVariables();

// Carrega appsettings.json
builder.Configuration.AddJsonFile("appsettings.json", optional: false, reloadOnChange: true);

// Substituição para JwtSettings:Secret
var jwtSecret = builder.Configuration["JWT_SECRET"]
    ?? throw new InvalidOperationException("JWT_SECRET não encontrada no .env");
var jwtSettings = builder.Configuration.GetSection("JwtSettings");
jwtSettings["Secret"] = jwtSettings["Secret"]?.Replace("{JWT_SECRET}", jwtSecret);

// Substituição para o bloco inteiro de Hotmart
var hotmartSection = builder.Configuration.GetSection("Hotmart");
if (hotmartSection.Exists())
{
    hotmartSection["ClientId"] = hotmartSection["ClientId"]
        ?.Replace("{HOTMART_CLIENT_ID}", builder.Configuration["HOTMART_CLIENT_ID"]
            ?? throw new InvalidOperationException("HOTMART_CLIENT_ID não encontrada"));

    hotmartSection["ClientSecret"] = hotmartSection["ClientSecret"]
        ?.Replace("{HOTMART_CLIENT_SECRET}", builder.Configuration["HOTMART_CLIENT_SECRET"]
            ?? throw new InvalidOperationException("HOTMART_CLIENT_SECRET não encontrada"));

    hotmartSection["ProductId"] = hotmartSection["ProductId"]
        ?.Replace("{PRODUCT_ID}", builder.Configuration["PRODUCT_ID"]
            ?? throw new InvalidOperationException("PRODUCT_ID não encontrada"));

    hotmartSection["Hottok"] = hotmartSection["Hottok"]
        ?.Replace("{HOTTOK}", builder.Configuration["HOTTOK"]
            ?? throw new InvalidOperationException("HOTTOK não encontrada"));
}
else
{
    throw new InvalidOperationException("Seção 'Hotmart' não encontrada no appsettings.json");
}

// Substituição para o bloco Gemini
var geminiSection = builder.Configuration.GetSection("Gemini");
if (geminiSection.Exists())
{
    geminiSection["ApiKey"] = geminiSection["ApiKey"]
        ?.Replace("{GEMINI_API_KEY}", builder.Configuration["GEMINI_API_KEY"]
            ?? throw new InvalidOperationException("GEMINI_API_KEY não encontrada no .env"));
}
else
{
    throw new InvalidOperationException("Seção 'Gemini' não encontrada no appsettings.json");
}

// JWT e webhook Hotmart continuam obrigatórios para subir a API
var requiredEnvVars = new[] { "JWT_SECRET", "HOTTOK" };
foreach (var varName in requiredEnvVars)
{
    if (string.IsNullOrWhiteSpace(builder.Configuration[varName]))
        throw new InvalidOperationException($"{varName} não encontrada no .env ou configuração");
}

// Monta connection string: template com placeholders (.env) OU string completa (ex.: Postgres local em Development)
var baseConnectionString = builder.Configuration.GetConnectionString("AppDbContext")
    ?? throw new InvalidOperationException("AppDbContext não encontrada no appsettings.json");

string connectionString;
if (baseConnectionString.Contains("{USER_ID}", StringComparison.Ordinal))
{
    var requiredDbEnvVars = new[] { "DB_PASSWORD", "USER_ID", "SERVER_URL", "PORT_API" };
    foreach (var varName in requiredDbEnvVars)
    {
        if (string.IsNullOrWhiteSpace(builder.Configuration[varName]))
            throw new InvalidOperationException($"{varName} não encontrada no .env ou configuração (necessária quando ConnectionStrings:AppDbContext usa placeholders).");
    }

    connectionString = baseConnectionString
        .Replace("{USER_ID}", builder.Configuration["USER_ID"])
        .Replace("{DB_PASSWORD}", builder.Configuration["DB_PASSWORD"])
        .Replace("{SERVER_URL}", builder.Configuration["SERVER_URL"])
        .Replace("{PORT_API}", builder.Configuration["PORT_API"]);
}
else
{
    connectionString = baseConnectionString.Trim();
}

// Limita conexões por instância (evita "Max client connections reached" no Postgres).
// Produção: ajuste Database:MaxPoolSize ou variável de ambiente Database__MaxPoolSize conforme max_connections ÷ instâncias da API.
var maxPoolSize = builder.Configuration.GetValue("Database:MaxPoolSize", 20);
if (maxPoolSize < 1)
    maxPoolSize = 20;
connectionString = $"{connectionString.TrimEnd(';')};Maximum Pool Size={maxPoolSize}";

// Registra DbContext
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString, npgsqlOptions =>
        npgsqlOptions.UseQuerySplittingBehavior(QuerySplittingBehavior.SplitQuery)));

// Identity
builder.Services.AddIdentity<Usuario, IdentityRole>()
    .AddEntityFrameworkStores<AppDbContext>()
    .AddDefaultTokenProviders();

// JWT Authentication
var jwtKey = Encoding.ASCII.GetBytes(builder.Configuration["JwtSettings:Secret"]);
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
}).AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(jwtKey),
        ValidateIssuer = true,
        ValidIssuer = builder.Configuration["JwtSettings:Issuer"],
        ValidateAudience = true,
        ValidAudience = builder.Configuration["JwtSettings:Audience"],
    };
});

// Services
builder.Services.AddScoped<AutenticacaoService>();
builder.Services.AddScoped<ProfessorService>();
builder.Services.AddScoped<EscolaService>();
builder.Services.AddScoped<AlunoService>();
builder.Services.AddScoped<HabilidadeService>();
builder.Services.AddScoped<PlanejamentoService>();
builder.Services.AddScoped<EstrategiaService>();
builder.Services.AddScoped<AvaliacaoService>();
builder.Services.AddHttpClient();
builder.Services.AddScoped<HotmartService>();
builder.Services.AddScoped<OnboardingWebhookService>();
builder.Services.AddScoped<AvaliacaoDiagnosticaService>();
builder.Services.AddScoped<EstudoDeCasoService>();
builder.Services.AddScoped<RelatoAtendimentoService>();
builder.Services.AddScoped<AdminService>();
builder.Services.AddScoped<AtividadeService>();
builder.Services.AddScoped<ConfiguracaoSiteService>();
builder.Services.AddScoped<EmailService>();
builder.Services.AddScoped<HotmartWebhookService>();
builder.Services.AddHostedService<HotmartReconciliacaoAssinaturasJob>();
builder.Services.AddScoped<DocumentoBibliotecaService>();
builder.Services.AddScoped<PromptSistemaIAService>();
builder.Services.AddScoped<GeracaoIALogService>();
builder.Services.AddHttpClient<api.Services.IA.IGeradorTextoIA, api.Services.IA.GeminiGeradorTextoIA>();

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

        // APLICA AS MIGRATIONS PENDENTES
        context.Database.Migrate();
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Erro ao conectar ao banco de dados: {ex.Message}");
    }
}

app.Run();