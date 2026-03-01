using LibraryManagementSystem.Application.DTOs;

namespace LibraryManagementSystem.Application.Interfaces;

public interface IIssuanceService
{
    Task<IssuanceDto> IssueBookAsync(IssueBookDto dto);
    Task<IssuanceDto> ReturnBookAsync(int issuanceId);
    Task<IEnumerable<IssuanceDto>> GetAllIssuancesAsync();
    Task<IEnumerable<IssuanceDto>> GetActiveIssuancesByStudentAsync(string studentId);
    Task DeleteIssuanceAsync(int issuanceId); // ✅ Added
}