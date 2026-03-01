using LibraryManagementSystem.Application.Interfaces;
using LibraryManagementSystem.Domain.Entities;
using LibraryManagementSystem.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace LibraryManagementSystem.Infrastructure.Repositories;

public class BookRepository : IBookRepository
{
    private readonly LibraryDbContext _context;

    public BookRepository(LibraryDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<Book>> GetAllAsync() =>
        await _context.Books.ToListAsync();

    public async Task<IEnumerable<Book>> GetAvailableAsync() =>
        await _context.Books.Where(b => b.AvailableCopies > 0).ToListAsync();

    public async Task<Book?> GetByIdAsync(int id) =>
        await _context.Books.FindAsync(id);

    public async Task<Book?> GetByISBNAsync(string isbn) =>
        await _context.Books.FirstOrDefaultAsync(b => b.ISBN == isbn);

    public async Task AddAsync(Book book) =>
        await _context.Books.AddAsync(book);

    public Task UpdateAsync(Book book)
    {
        _context.Books.Update(book);
        return Task.CompletedTask;
    }

    public Task DeleteAsync(Book book) // ✅ Added
    {
        _context.Books.Remove(book);
        return Task.CompletedTask;
    }

    public async Task SaveChangesAsync() =>
        await _context.SaveChangesAsync();
}