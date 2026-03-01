using LibraryManagementSystem.Application.DTOs;
using LibraryManagementSystem.Application.Interfaces;
using LibraryManagementSystem.Domain.Entities;

namespace LibraryManagementSystem.Application.Services;

public class IssuanceService : IIssuanceService
{
    private readonly IIssuanceRepository _issuanceRepo;
    private readonly IBookRepository _bookRepo;

    public IssuanceService(IIssuanceRepository issuanceRepo, IBookRepository bookRepo)
    {
        _issuanceRepo = issuanceRepo;
        _bookRepo = bookRepo;
    }

    public async Task<IssuanceDto> IssueBookAsync(IssueBookDto dto)
    {
        var book = await _bookRepo.GetByIdAsync(dto.BookId)
            ?? throw new KeyNotFoundException($"Book with ID {dto.BookId} not found.");

        if (book.AvailableCopies <= 0)
            throw new InvalidOperationException($"No available copies of '{book.Title}'.");

        book.AvailableCopies--;
        await _bookRepo.UpdateAsync(book);

        var issuance = new Issuance
        {
            BookId = dto.BookId,
            StudentName = dto.StudentName,
            StudentId = dto.StudentId,
            IssuedAt = DateTime.UtcNow,
            DueDate = DateTime.UtcNow.AddDays(dto.DueDays)
        };

        await _issuanceRepo.AddAsync(issuance);
        await _issuanceRepo.SaveChangesAsync();

        return MapToDto(issuance, book.Title);
    }

    public async Task<IssuanceDto> ReturnBookAsync(int issuanceId)
    {
        var issuance = await _issuanceRepo.GetByIdAsync(issuanceId)
            ?? throw new KeyNotFoundException($"Issuance record {issuanceId} not found.");

        if (issuance.IsReturned)
            throw new InvalidOperationException("This book has already been returned.");

        var book = await _bookRepo.GetByIdAsync(issuance.BookId)
            ?? throw new KeyNotFoundException("Associated book not found.");

        issuance.IsReturned = true;
        issuance.ReturnedAt = DateTime.UtcNow;
        book.AvailableCopies++;

        await _issuanceRepo.UpdateAsync(issuance);
        await _bookRepo.UpdateAsync(book);
        await _issuanceRepo.SaveChangesAsync();

        return MapToDto(issuance, book.Title);
    }

    public async Task<IEnumerable<IssuanceDto>> GetAllIssuancesAsync()
    {
        var issuances = await _issuanceRepo.GetAllAsync();
        return issuances.Select(i => MapToDto(i, i.Book?.Title ?? ""));
    }

    public async Task<IEnumerable<IssuanceDto>> GetActiveIssuancesByStudentAsync(string studentId)
    {
        var issuances = await _issuanceRepo.GetActiveByStudentAsync(studentId);
        return issuances.Select(i => MapToDto(i, i.Book?.Title ?? ""));
    }

    public async Task DeleteIssuanceAsync(int issuanceId)
    {
        var issuance = await _issuanceRepo.GetByIdAsync(issuanceId)
            ?? throw new KeyNotFoundException($"Issuance record {issuanceId} not found.");

        if (!issuance.IsReturned)
            throw new InvalidOperationException("Cannot delete an active issuance. Return the book first.");

        await _issuanceRepo.DeleteAsync(issuance);
        await _issuanceRepo.SaveChangesAsync();
    }

    private static IssuanceDto MapToDto(Issuance i, string bookTitle) => new()
    {
        Id = i.Id,
        BookId = i.BookId,
        BookTitle = bookTitle,
        StudentName = i.StudentName,
        StudentId = i.StudentId,
        IssuedAt = i.IssuedAt,
        DueDate = i.DueDate,
        ReturnedAt = i.ReturnedAt,
        IsReturned = i.IsReturned
    };
}