using EventFinder.Application.Common;
using EventFinder.Application.DTOs;
using EventFinder.Application.Interfaces;
using EventFinder.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace EventFinder.API.Controllers
{
    [ApiController]
    [Route("api/v1.0/[controller]")]
    public class EventsController : ControllerBase
    {
        private readonly IEventService _eventService;
        private readonly IWebHostEnvironment _env;
        private readonly ILogger<EventsController> _logger;

        private Guid CurrentUserId => Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? throw new UnauthorizedAccessException());
        private Guid UserProfileId => Guid.Parse(User.FindFirst(Constants.ProfileIdClaimName)?.Value ?? throw new UnauthorizedAccessException());

        public EventsController(IEventService eventService, IWebHostEnvironment env, ILogger<EventsController> logger)
        {
            _eventService = eventService;
            _env = env;
            _logger = logger;
        }

        [Authorize]
        [HttpGet]
        public async Task<ActionResult<IEnumerable<EventDto>>> GetAll()
        {
            var events = await _eventService.GetAllEventsAsync(UserProfileId);
            return Ok(events);
        }

        [Authorize]

        [HttpGet("{id:guid}")]
        public async Task<ActionResult<EventDto>> GetById(Guid id)
        {
            var @event = await _eventService.GetEventByIdAsync(id, UserProfileId);
            if (@event == null) return NotFound();
            return Ok(@event);
        }

        [Authorize]

        [HttpGet("organizer/{organizerId:guid}")]
        public async Task<ActionResult<IEnumerable<EventDto>>> GetByOrganizer(Guid organizerId)
        {
            var events = await _eventService.GetEventsByOrganizerAsync(organizerId);
            return Ok(events);
        }

        [Authorize]

        [HttpGet("user/registered")]
        public async Task<ActionResult<IEnumerable<EventDto>>> GetRegistered()
        {
            var events = await _eventService.GetUserRegisteredEventsAsync(UserProfileId);
            return Ok(events);
        }

        [Authorize]

        [HttpPost]
        public async Task<ActionResult<EventDto>> Create(EventDto dto)
        {
            var created = await _eventService.CreateEventAsync(dto, UserProfileId, "CurrentUserName", null);
            _logger.LogCritical($"Id after creating::::::::: {created.Id}");
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);

        }

        [Authorize]

        [HttpPut("{id:guid}")]
        public async Task<ActionResult<EventDto>> Update(Guid id, EventDto dto)
        {
            try
            {
                var result = await _eventService.UpdateEventAsync(id, dto, UserProfileId);
                if (result == null) return NotFound();
                return Ok(result);
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
        }

        [Authorize]

        [HttpDelete("{id:guid}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            try
            {
                var deleted = await _eventService.DeleteEventAsync(id, UserProfileId);
                if (!deleted) return NotFound();
                return NoContent();
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
        }

        [Authorize]

        [HttpPost("{id:guid}/register")]
        public async Task<ActionResult<EventDto>> Register(Guid id)
        {
            var result = await _eventService.RegisterForEventAsync(id, UserProfileId);
            if (result == null) return NotFound();
            return Ok(result);
        }

        [HttpDelete("{id:guid}/register")]
        public async Task<ActionResult<EventDto>> CancelRegistration(Guid id)
        {
            var result = await _eventService.CancelRegistrationAsync(id, UserProfileId);
            if (result == null) return NotFound();
            return Ok(result);
        }

        [Authorize]
        [HttpPost("{id:guid}/image")]
        public async Task<ActionResult<EventDto>> UploadImage(Guid id, IFormFile file,
            [FromServices] IWebHostEnvironment env)
        {
            if (file == null || file.Length == 0)
                return BadRequest("No file uploaded.");

            // Allowed image extensions
            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif", ".bmp" };
            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (!allowedExtensions.Contains(extension))
                return BadRequest("Invalid file type. Allowed: jpg, jpeg, png, gif, bmp.");

            // Ensure wwwroot/exact path
            var webRoot = env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
            var uploadsFolder = Path.Combine(webRoot, "images", "events");

            _logger.LogCritical($"Web root path {env.WebRootPath} or web Root: {webRoot} and uploadsFolder is {uploadsFolder}");

            Directory.CreateDirectory(uploadsFolder);

            var fileName = $"{Guid.NewGuid()}{extension}";
            var filePath = Path.Combine(uploadsFolder, fileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            var imageUrl = $"/images/events/{fileName}";

            try
            {
                var result = await _eventService.SetEventImageAsync(id, UserProfileId, imageUrl);
                if (result == null) return NotFound();
                return Ok(result);
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
        }

        [HttpGet("{id:guid}/image")]
        public async Task<IActionResult> GetImage(Guid id)
        {
            _logger.LogCritical($"Id after getting::::::::: {id}");
            var @event = await _eventService.GetEventByIdAsync(id);
            if (@event == null || string.IsNullOrEmpty(@event.Image))
                return NotFound();

            var webRoot = _env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
            var fullPath = Path.Combine(webRoot, @event.Image.TrimStart('/'));
            _logger.LogCritical($"Full path:::::::: {fullPath}");

            if (!System.IO.File.Exists(fullPath))
                return NotFound();

            var contentType = GetContentType(Path.GetExtension(fullPath));
            _logger.LogCritical($"Content type:::::::: {contentType}");
            return PhysicalFile(fullPath, contentType);
        }

        private string GetContentType(string extension)
        {
            return extension.ToLowerInvariant() switch
            {
                ".jpg" or ".jpeg" => "image/jpeg",
                ".png" => "image/png",
                ".gif" => "image/gif",
                ".bmp" => "image/bmp",
                _ => "application/octet-stream",
            };
        }
    }
}