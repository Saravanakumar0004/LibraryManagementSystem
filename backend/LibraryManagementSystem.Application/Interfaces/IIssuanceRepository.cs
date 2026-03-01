using LibraryManagementSystem.Domain.Entities;

namespace LibraryManagementSystem.Application.Interfaces;

public interface IIssuanceRepository
{
    Task<IEnumerable<Issuance>> GetAllAsync();
    Task<IEnumerable<Issuance>> GetActiveByStudentAsync(string studentId);
    Task<Issuance?> GetByIdAsync(int id);
    Task AddAsync(Issuance issuance);
    Task UpdateAsync(Issuance issuance);
    Task DeleteAsync(Issuance issuance); // ✅ Added
    Task SaveChangesAsync();
}