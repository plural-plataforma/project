using Microsoft.EntityFrameworkCore;

namespace PluralPlataforma.Api.Data;

public class AppDbContext : DbContext
{
 public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }
}