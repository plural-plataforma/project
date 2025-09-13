using Microsoft.EntityFrameworkCore;
using PluralPlataforma.Api.Data;

var builder = WebApplication.CreateBuilder(args);

// Configurar SQLite com caminho absoluto para evitar problemas
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite("Data Source=D:\\repos\\plural-plataforma\\local\\db\\plural_plataforma.db"));

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Criar banco na inicialização
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    try
    {
        db.Database.EnsureCreated();
        Console.WriteLine("Banco SQLite criado com sucesso.");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Erro ao criar banco: {ex.Message}");
    }
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Endpoint para verificar conexão
app.MapGet("/health", async (AppDbContext db) =>
{
    try
    {
        var canConnect = await db.Database.CanConnectAsync();
        return Results.Ok(new { Status = "API is running", DatabaseConnected = canConnect });
    }
    catch (Exception ex)
    {
        return Results.Problem(new Microsoft.AspNetCore.Mvc.ProblemDetails
        {
            Title = "Database connection failed",
            Detail = ex.Message,
            Extensions = { { "InnerException", ex.InnerException?.Message ?? "Nenhum InnerException" } }
        });
    }
});

// Endpoint para forçar criação do banco
app.MapGet("/api/test-db", async (AppDbContext db) =>
{
    try
    {
        await db.Database.EnsureCreatedAsync();
        return Results.Ok(new { Message = "Database created or exists" });
    }
    catch (Exception ex)
    {
        return Results.Problem($"Failed to create database: {ex.Message}");
    }
});

app.Run();