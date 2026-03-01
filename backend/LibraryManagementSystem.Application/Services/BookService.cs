using LibraryManagementSystem.Application.DTOs;
using LibraryManagementSystem.Application.Interfaces;
using LibraryManagementSystem.Domain.Entities;

namespace LibraryManagementSystem.Application.Services;

public class BookService : IBookService
{
    private readonly IBookRepository _bookRepo;

    public BookService(IBookRepository bookRepo)
    {
        _bookRepo = bookRepo;
    }

    public async Task<IEnumerable<BookDto>> GetAllBooksAsync()
    {
        var books = await _bookRepo.GetAllAsync();
        return books.Select(MapToDto);
    }

    public async Task<IEnumerable<BookDto>> GetAvailableBooksAsync()
    {
        var books = await _bookRepo.GetAvailableAsync();
        return books.Select(MapToDto);
    }

    public async Task<BookDto?> GetBookByIdAsync(int id)
    {
        var book = await _bookRepo.GetByIdAsync(id);
        return book == null ? null : MapToDto(book);
    }

    public async Task<BookDto> AddBookAsync(CreateBookDto dto)
    {
        var existing = await _bookRepo.GetByISBNAsync(dto.ISBN);
        if (existing != null)
            throw new InvalidOperationException($"A book with ISBN '{dto.ISBN}' already exists.");

        var book = new Book
        {
            Title = dto.Title,
            Author = dto.Author,
            ISBN = dto.ISBN,
            TotalCopies = dto.TotalCopies,
            AvailableCopies = dto.TotalCopies
        };

        await _bookRepo.AddAsync(book);
        await _bookRepo.SaveChangesAsync();

        return MapToDto(book);
    }

    public async Task DeleteBookAsync(int id)
    {
        var book = await _bookRepo.GetByIdAsync(id)
            ?? throw new KeyNotFoundException($"Book {id} not found.");

        if (book.AvailableCopies < book.TotalCopies)
            throw new InvalidOperationException("Cannot delete a book that is currently issued.");

        await _bookRepo.DeleteAsync(book);
        await _bookRepo.SaveChangesAsync();
    }

    private static BookDto MapToDto(Book book) => new()
    {
        Id = book.Id,
        Title = book.Title,
        Author = book.Author,
        ISBN = book.ISBN,
        TotalCopies = book.TotalCopies,
        AvailableCopies = book.AvailableCopies
    };
}