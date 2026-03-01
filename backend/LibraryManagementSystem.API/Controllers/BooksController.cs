using LibraryManagementSystem.Application.DTOs;
using LibraryManagementSystem.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace LibraryManagementSystem.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BooksController : ControllerBase
{
    private readonly IBookService _bookService;

    public BooksController(IBookService bookService)
    {
        _bookService = bookService;
    }

    /// <summary>Get all books</summary>
    [HttpGet]
    public async Task<IActionResult> GetAll() =>
        Ok(await _bookService.GetAllBooksAsync());

    /// <summary>Get only available books</summary>
    [HttpGet("available")]
    public async Task<IActionResult> GetAvailable() =>
        Ok(await _bookService.GetAvailableBooksAsync());

    /// <summary>Get book by ID</summary>
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var book = await _bookService.GetBookByIdAsync(id);
        return book == null ? NotFound($"Book {id} not found.") : Ok(book);
    }

    /// <summary>Add a new book</summary>
    [HttpPost]
    public async Task<IActionResult> AddBook([FromBody] CreateBookDto dto)
    {
        try
        {
            var book = await _bookService.AddBookAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = book.Id }, book);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(ex.Message);
        }
    }

    /// <summary>Delete a book by ID</summary>
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteBook(int id)
    {
        try
        {
            await _bookService.DeleteBookAsync(id);
            return NoContent();
        }
        catch (KeyNotFoundException ex) { return NotFound(ex.Message); }
        catch (InvalidOperationException ex) { return BadRequest(ex.Message); }
    }

}