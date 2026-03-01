using LibraryManagementSystem.Application.DTOs;

namespace LibraryManagementSystem.Application.Interfaces;

public interface IBookService
{
    Task<IEnumerable<BookDto>> GetAllBooksAsync();
    Task<IEnumerable<BookDto>> GetAvailableBooksAsync();
    Task<BookDto?> GetBookByIdAsync(int id);
    Task<BookDto> AddBookAsync(CreateBookDto dto);
    Task DeleteBookAsync(int id); // ✅ Added
}