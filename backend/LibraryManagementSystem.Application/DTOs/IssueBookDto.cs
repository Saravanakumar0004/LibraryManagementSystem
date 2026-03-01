namespace LibraryManagementSystem.Application.DTOs;

public class IssueBookDto
{
    public int BookId { get; set; }
    public string StudentName { get; set; } = string.Empty;
    public string StudentId { get; set; } = string.Empty;
    public int DueDays { get; set; } = 14;
}

public class IssuanceDto
{
    public int Id { get; set; }
    public int BookId { get; set; }
    public string BookTitle { get; set; } = string.Empty;
    public string StudentName { get; set; } = string.Empty;
    public string StudentId { get; set; } = string.Empty;
    public DateTime IssuedAt { get; set; }
    public DateTime DueDate { get; set; }
    public DateTime? ReturnedAt { get; set; }
    public bool IsReturned { get; set; }
    public bool IsOverdue => !IsReturned && DateTime.UtcNow > DueDate;
}
