using LibraryManagementSystem.Application.Interfaces;
using LibraryManagementSystem.Domain.Entities;
using LibraryManagementSystem.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace LibraryManagementSystem.Infrastructure.Repositories;

public class IssuanceRepository : IIssuanceRepository
{
    private readonly LibraryDbContext _context;

    public IssuanceRepository(LibraryDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<Issuance>> GetAllAsync() =>
        await _context.Issuances.Include(i => i.Book).ToListAsync();

    public async Task<Issuance?> GetByIdAsync(int id) =>
        await _context.Issuances.Include(i => i.Book).FirstOrDefaultAsync(i => i.Id == id);

    public async Task<IEnumerable<Issuance>> GetActiveByStudentAsync(string studentId) =>
        await _context.Issuances
            .Include(i => i.Book)
            .Where(i => i.StudentId == studentId && !i.IsReturned)
            .ToListAsync();

    public async Task AddAsync(Issuance issuance) =>
        await _context.Issuances.AddAsync(issuance);

    public Task UpdateAsync(Issuance issuance)
    {
        _context.Issuances.Update(issuance);
        return Task.CompletedTask;
    }

    public Task DeleteAsync(Issuance issuance) // ✅ Added
    {
        _context.Issuances.Remove(issuance);
        return Task.CompletedTask;
    }

    public async Task SaveChangesAsync() =>
        await _context.SaveChangesAsync();
}