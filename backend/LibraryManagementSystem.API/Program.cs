using LibraryManagementSystem.Application.Interfaces;
using LibraryManagementSystem.Application.Services;
using LibraryManagementSystem.Infrastructure.Data;
using LibraryManagementSystem.Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

//
// 🔹 Database Configuration
//
builder.Services.AddDbContext<LibraryDbContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("DefaultConnection")
    ));

//
// 🔹 Dependency Injection - Repositories
//
builder.Services.AddScoped<IBookRepository, BookRepository>();
builder.Services.AddScoped<IIssuanceRepository, IssuanceRepository>();

//
// 🔹 Dependency Injection - Services
//
builder.Services.AddScoped<IBookService, BookService>();
builder.Services.AddScoped<IIssuanceService, IssuanceService>();

//
// ✅ CORS — Allow React frontend & Render domain
//
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp", policy =>
    {
        policy.WithOrigins(
                "http://localhost:5173",
                "http://localhost:3000",
                "http://localhost:4173",
                "https://librarymanagementsystem-x8qy.onrender.com"
              )
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

//
// 🔹 Controllers & Swagger
//
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

//
// 🔹 Auto Apply Migrations on Startup
//
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<LibraryDbContext>();
    dbContext.Database.Migrate();
}

//
// 🔹 Enable Swagger
//
app.UseSwagger();
app.UseSwaggerUI();

//
// ❗ IMPORTANT for Render (avoid HTTPS redirect loop)
//
app.UseHttpsRedirection();

//
// ✅ CORS
//
app.UseCors("AllowReactApp");

//
// 🔹 Map Controllers
//
app.MapControllers();

app.Run();