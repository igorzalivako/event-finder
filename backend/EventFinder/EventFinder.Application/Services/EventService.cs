using AutoMapper;
using EventFinder.Application.DTOs;
using EventFinder.Application.Interfaces;
using EventFinder.Domain.Entities;

namespace EventFinder.Application.Services
{
    public class EventService : IEventService
    {
        private readonly IRepository<Event> _eventRepository;
        private readonly IRepository<Registration> _registratoinRepository;

        private readonly IMapper _mapper;

        public EventService(IRepository<Event> eventRepository, IMapper mapper, IRepository<Registration> registrationRepostiory)
        {
            _eventRepository = eventRepository;
            _registratoinRepository = registrationRepostiory;
            _mapper = mapper;
        }

        public async Task<IEnumerable<EventDto>> GetAllEventsAsync(Guid? currentUserId = null)
        {
            var events = await _eventRepository.GetAllAsync(e => e.Registrations);
            var dtos = new List<EventDto>();

            foreach (var @event in events)
            {
                var dto = _mapper.Map<EventDto>(@event);
                if (@event.Registrations.FirstOrDefault(r => r.UserId == currentUserId.ToString()) != null)
                {
                    dto.AmIMember = false;
                }
                dtos.Add(dto);
            }

            return dtos;
        }

        public async Task<IEnumerable<EventDto>> GetEventsByOrganizerAsync(Guid organizerId)
        {
            var events = await _eventRepository.GetAllAsync();
            events = events.Where(e => e.OrganizerId == organizerId.ToString());
            return _mapper.Map<IEnumerable<EventDto>>(events);
        }

        public async Task<IEnumerable<EventDto>> GetUserRegisteredEventsAsync(Guid userId)
        {
            var events = await _eventRepository.GetAllAsync(e => e.Registrations);
            events = events.Where(e => e.Registrations.FirstOrDefault(r => r.UserId == userId.ToString()) != null);
            var dtos = new List<EventDto>();

            foreach (var @event in events)
            {
                var dto = _mapper.Map<EventDto>(@event);
                if (@event.Registrations.FirstOrDefault(r => r.UserId == userId.ToString()) == null)
                {
                    dto.AmIMember = false;
                }
                dtos.Add(dto);
            }
            return dtos;
        }

        public async Task<EventDto?> GetEventByIdAsync(Guid id, Guid? currentUserId = null)
        {
            var entity = await _eventRepository.GetByIdAsync(id, e => e.Registrations);
            if (entity == null) return null;
            var dto = _mapper.Map<EventDto>(entity);
            if (entity.Registrations.FirstOrDefault(r => r.UserId == currentUserId.ToString()) != null)
            {
                dto.AmIMember = true;
            }
            return dto;
        }

        public async Task<EventDto> CreateEventAsync(EventDto dto, Guid organizerId, string organizerName, string? organizerAvatar)
        {
            var entity = _mapper.Map<Event>(dto);
            entity.OrganizerId = organizerId.ToString();
            entity.OrganizerName = organizerName;
            entity.OrganizerAvatar = organizerAvatar;
            var created = await _eventRepository.AddAsync(entity);
            await _eventRepository.SaveChangesAsync();
            return _mapper.Map<EventDto>(created);
        }

        public async Task<EventDto?> UpdateEventAsync(Guid id, EventDto dto, Guid userId)
        {
            var existing = await _eventRepository.GetByIdAsync(id);
            if (existing == null) return null;
            if (existing.OrganizerId != userId.ToString())
                throw new UnauthorizedAccessException("Only the organizer can update this event.");

            _mapper.Map(dto, existing);
            existing.Id = id.ToString();
            existing.OrganizerId = userId.ToString();
            _eventRepository.Update(existing);
            await _eventRepository.SaveChangesAsync();
            return _mapper.Map<EventDto>(existing);
        }

        public async Task<bool> DeleteEventAsync(Guid id, Guid userId)
        {
            var existing = await _eventRepository.GetByIdAsync(id);
            if (existing == null) return false;
            if (existing.OrganizerId != userId.ToString())
                throw new UnauthorizedAccessException("Only the organizer can delete this event.");

            _eventRepository.Delete(existing);
            await _eventRepository.SaveChangesAsync();
            return true;
        }

        public async Task<EventDto?> RegisterForEventAsync(Guid eventId, Guid userId)
        {
            // Placeholder: real registration logic would go here.
            Registration registration = new Registration { EventId = eventId.ToString(), UserId = userId.ToString() };

            try
            {
                await _registratoinRepository.AddAsync(registration);
                var currEvent = await _eventRepository.GetByIdAsync(eventId);
                currEvent.AvailableSpots -= 1;
                _eventRepository.Update(currEvent);
                await _eventRepository.SaveChangesAsync();
            }
            catch
            {
                return null;
            }

            var entity = await _eventRepository.GetByIdAsync(eventId, e => e.Registrations);
            if (entity == null) return null;
            var dto = _mapper.Map<EventDto>(entity);
            if (entity.Registrations.FirstOrDefault(r => r.UserId == userId.ToString()) != null)
            {
                dto.AmIMember = true;
            }
            return dto;
        }

        public async Task<EventDto?> CancelRegistrationAsync(Guid eventId, Guid userId)
        {
            var registrations = await _registratoinRepository.GetAllAsync();
            var registration = registrations.Where(r => r.EventId == eventId.ToString() && r.UserId == userId.ToString()).FirstOrDefault();

            try
            {
                _registratoinRepository.Delete(registration);
                var currEvent = await _eventRepository.GetByIdAsync(eventId);
                currEvent.AvailableSpots += 1;
                _eventRepository.Update(currEvent);
                await _eventRepository.SaveChangesAsync();
            }
            catch
            {
                return null;
            }

            var entity = await _eventRepository.GetByIdAsync(eventId);
            if (entity == null) return null;
            var dto = _mapper.Map<EventDto>(entity);
            dto.AmIMember = false;
            return dto;
        }

        public async Task<EventDto?> SetEventImageAsync(Guid eventId, Guid userId, string imageUrl)
        {
            var entity = await _eventRepository.GetByIdAsync(eventId);
            if (entity == null) return null;
            if (entity.OrganizerId != userId.ToString())
                throw new UnauthorizedAccessException("Only the organizer can set the event image.");

            entity.Image = imageUrl;
            _eventRepository.Update(entity);
            await _eventRepository.SaveChangesAsync();

            return _mapper.Map<EventDto>(entity);
        }
    }
}