using LibraryManagementSystem.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace LibraryManagementSystem.Infrastructure.Data;

public class LibraryDbContext : DbContext
{
    public LibraryDbContext(DbContextOptions<LibraryDbContext> options) : base(options) { }

    public DbSet<Book> Books => Set<Book>();
    public DbSet<Issuance> Issuances => Set<Issuance>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Book>(entity =>
        {
            entity.HasKey(b => b.Id);
            entity.Property(b => b.Title).IsRequired().HasMaxLength(200);
            entity.Property(b => b.Author).IsRequired().HasMaxLength(150);
            entity.Property(b => b.ISBN).IsRequired().HasMaxLength(20);
            entity.HasIndex(b => b.ISBN).IsUnique();
        });

        modelBuilder.Entity<Issuance>(entity =>
        {
            entity.HasKey(i => i.Id);
            entity.Property(i => i.StudentName).IsRequired().HasMaxLength(150);
            entity.Property(i => i.StudentId).IsRequired().HasMaxLength(50);
            entity.HasOne(i => i.Book)
                  .WithMany(b => b.Issuances)
                  .HasForeignKey(i => i.BookId)
                  .OnDelete(DeleteBehavior.Restrict);
        });
    }
}
