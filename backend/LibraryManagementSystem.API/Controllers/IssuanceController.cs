using LibraryManagementSystem.Application.DTOs;
using LibraryManagementSystem.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace LibraryManagementSystem.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class IssuanceController : ControllerBase
{
    private readonly IIssuanceService _issuanceService;

    public IssuanceController(IIssuanceService issuanceService)
    {
        _issuanceService = issuanceService;
    }

    /// <summary>Get all issuance records</summary>
    [HttpGet]
    public async Task<IActionResult> GetAll() =>
        Ok(await _issuanceService.GetAllIssuancesAsync());

    /// <summary>Get active books issued to a student</summary>
    [HttpGet("student/{studentId}")]
    public async Task<IActionResult> GetByStudent(string studentId) =>
        Ok(await _issuanceService.GetActiveIssuancesByStudentAsync(studentId));

    /// <summary>Issue a book to a student</summary>
    [HttpPost("issue")]
    public async Task<IActionResult> IssueBook([FromBody] IssueBookDto dto)
    {
        try
        {
            var result = await _issuanceService.IssueBookAsync(dto);
            return Ok(result);
        }
        catch (KeyNotFoundException ex) { return NotFound(ex.Message); }
        catch (InvalidOperationException ex) { return BadRequest(ex.Message); }
    }

    /// <summary>Return a book</summary>
    [HttpPut("return/{issuanceId:int}")]
    public async Task<IActionResult> ReturnBook(int issuanceId)
    {
        try
        {
            var result = await _issuanceService.ReturnBookAsync(issuanceId);
            return Ok(result);
        }
        catch (KeyNotFoundException ex) { return NotFound(ex.Message); }
        catch (InvalidOperationException ex) { return BadRequest(ex.Message); }
    }

    /// <summary>Delete an issuance record</summary>
    [HttpDelete("{issuanceId:int}")]
    public async Task<IActionResult> DeleteIssuance(int issuanceId)
    {
        try
        {
            await _issuanceService.DeleteIssuanceAsync(issuanceId);
            return NoContent();
        }
        catch (KeyNotFoundException ex) { return NotFound(ex.Message); }
        catch (InvalidOperationException ex) { return BadRequest(ex.Message); }
    }
}