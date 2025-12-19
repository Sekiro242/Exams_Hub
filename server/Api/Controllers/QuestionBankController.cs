using System;
using Microsoft.AspNetCore.Mvc;
using QuizesApi.Models;
using QuizesApi.Repositories.Interfaces;
namespace QuizesApi.Controllers
{
        [ApiController]
        [Route("api/[controller]")]
        public class QuestionBankController : ControllerBase
        {
            private readonly IQuestionBankRepo _repo;

            public QuestionBankController(IQuestionBankRepo repo)
            {
                _repo = repo;
            }

            [HttpGet]
            public async Task<ActionResult<IEnumerable<QuestionBankReadDto>>> GetAll()
            {
                var questions = await _repo.GetAllAsync();
                return Ok(questions.Select(q => new QuestionBankReadDto
                {
                    AccountId = q.AccountId,
                    BankKey = q.BankKey,
                    BankTitle = q.BankTitle ?? string.Empty,
                    BankDescription = q.BankDescription,
                    Grade = q.Grade,
                    QuestionId = q.QuestionId,
                    QuestionTitle = q.QuestionTitle,
                    OptionA = q.OptionA,
                    OptionB = q.OptionB,
                    OptionC = q.OptionC,
                    OptionD = q.OptionD,
                    CorrectAnswer = q.CorrectAnswer,
                    QuestionSubject = q.QuestionSubject,
                    Mark = q.Mark ?? 0
                }));
            }

            [HttpGet("{id}")]
            public async Task<ActionResult<QuestionBankReadDto>> GetById(long id)
            {
                var question = await _repo.GetByIdAsync(id);
                if (question == null) return NotFound();

                return Ok(new QuestionBankReadDto
                {
                    AccountId = question.AccountId,
                    BankKey = question.BankKey,
                    BankTitle = question.BankTitle ?? string.Empty,
                    BankDescription = question.BankDescription,
                    Grade = question.Grade,
                    QuestionId = question.QuestionId,
                    QuestionTitle = question.QuestionTitle,
                    OptionA = question.OptionA,
                    OptionB = question.OptionB,
                    OptionC = question.OptionC,
                    OptionD = question.OptionD,
                    CorrectAnswer = question.CorrectAnswer,
                    QuestionSubject = question.QuestionSubject,
                    Mark = question.Mark ?? 0
                });
            }

            [HttpPost]
            public async Task<ActionResult> Create(QuestionBankCreateDto dto)
            {
                try
                {
                    if (dto.AccountId <= 0)
                        return BadRequest(new { message = "AccountId is required and must be greater than 0" });

                    if (string.IsNullOrWhiteSpace(dto.QuestionTitle))
                        return BadRequest(new { message = "Question title is required" });

                    var newQuestion = new QuestionBank
                    {
                        AccountId = dto.AccountId,
                        BankKey = string.IsNullOrWhiteSpace(dto.BankKey) ? Guid.NewGuid().ToString() : dto.BankKey,
                        BankTitle = dto.BankTitle,
                        BankDescription = dto.BankDescription,
                        Grade = dto.Grade,
                        QuestionTitle = dto.QuestionTitle,
                        OptionA = dto.OptionA,
                        OptionB = dto.OptionB,
                        OptionC = dto.OptionC,
                        OptionD = dto.OptionD,
                        OptionE = dto.OptionE,
                        OptionF = dto.OptionF,
                        OptionG = dto.OptionG,
                        OptionH = dto.OptionH,
                        UsedOptions = dto.UsedOptions,
                        CorrectAnswer = dto.CorrectAnswer,
                        QuestionSubject = dto.QuestionSubject,
                        Mark = dto.Mark
                    };

                    await _repo.AddAsync(newQuestion);
                    await _repo.SaveChangesAsync();

                    return CreatedAtAction(nameof(GetById), new { id = newQuestion.QuestionId }, newQuestion);
                }
                catch (Exception ex)
                {
                    return StatusCode(500, new { message = $"Error creating question: {ex.Message}" });
                }
            }

            [HttpPut("{id}")]
            public async Task<ActionResult> Update(long id, QuestionBankUpdateDto dto)
            {
                try
                {
                    var question = await _repo.GetByIdAsync(id);
                    if (question == null) return NotFound(new { message = $"Question with id {id} not found" });

                    if (string.IsNullOrWhiteSpace(dto.QuestionTitle))
                        return BadRequest(new { message = "Question title is required" });

                    question.BankKey = string.IsNullOrWhiteSpace(dto.BankKey) ? question.BankKey : dto.BankKey;
                    question.AccountId = dto.AccountId;
                    question.BankTitle = dto.BankTitle;
                    question.BankDescription = dto.BankDescription;
                    question.Grade = dto.Grade;
                    question.QuestionTitle = dto.QuestionTitle;
                    question.OptionA = dto.OptionA;
                    question.OptionB = dto.OptionB;
                    question.OptionC = dto.OptionC;
                    question.OptionD = dto.OptionD;
                    question.OptionE = dto.OptionE;
                    question.OptionF = dto.OptionF;
                    question.OptionG = dto.OptionG;
                    question.OptionH = dto.OptionH;
                    question.UsedOptions = dto.UsedOptions;
                    question.CorrectAnswer = dto.CorrectAnswer;
                    question.QuestionSubject = dto.QuestionSubject;
                    question.Mark = dto.Mark;

                    await _repo.UpdateAsync(question);
                    await _repo.SaveChangesAsync();

                    return NoContent();
                }
                catch (Exception ex)
                {
                    return StatusCode(500, new { message = $"Error updating question: {ex.Message}" });
                }
            }

            [HttpDelete("{id}")]
            public async Task<ActionResult> Delete(long id)
            {
                await _repo.DeleteAsync(id);
                await _repo.SaveChangesAsync();
                return NoContent();
            }
        }
}
