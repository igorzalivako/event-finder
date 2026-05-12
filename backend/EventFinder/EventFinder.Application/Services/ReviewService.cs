using AutoMapper;
using EventFinder.Application.DTOs;
using EventFinder.Application.Interfaces;
using EventFinder.Domain.Entities;

namespace EventFinder.Application.Services
{
    public class ReviewService : IReviewService
    {
        private readonly IRepository<Review> _reviewRepository;
        private readonly IRepository<Event> _eventRepository;
        private readonly IRepository<User> _userRepository;
        private readonly IMapper _mapper;

        public ReviewService(IRepository<Review> reviewRepository, IRepository<Event> eventRepository, IMapper mapper, IRepository<User> userRepository)
        {
            _reviewRepository = reviewRepository;
            _eventRepository = eventRepository;
            _mapper = mapper;
            _userRepository = userRepository;
        }

        public async Task<IEnumerable<ReviewDto>> GetAllReviewsAsync()
        {
            var reviews = await _reviewRepository.GetAllAsync();
            var reviewsDtos = _mapper.Map<IEnumerable<ReviewDto>>(reviews);
            return reviewsDtos;
        }

        public async Task<ReviewDto?> GetReviewByIdAsync(Guid id)
        {
            var review = await _reviewRepository.GetByIdAsync(id);
            return review == null ? null : _mapper.Map<ReviewDto>(review);
        }

        public async Task<IEnumerable<ReviewDto>> GetReviewsByUserAsync(Guid userId)
        {
            var reviews = await _reviewRepository.GetAllAsync();
            reviews = reviews.Where(r => r.UserId == userId.ToString());
            var dtos = _mapper.Map<IEnumerable<ReviewDto>>(reviews);
            foreach (ReviewDto dto in dtos)
            {
                dto.UserName = (await _userRepository.GetByIdAsync(Guid.Parse(dto.UserId))).UserName;
            }
            return dtos;
        }

        public async Task<IEnumerable<ReviewDto>> GetReviewsByOrganizerAsync(Guid organizerId)
        {
            // Gathers reviews where the associated event's organizer matches
            var events = await _eventRepository.GetAllAsync();
            events = events.Where(e => e.OrganizerId == organizerId.ToString());
            var eventIds = events.Select(e => e.Id).ToList();
            var reviews = await _reviewRepository.GetAllAsync();
            reviews = reviews.Where(r => eventIds.Contains(r.EventId.ToString()));
            var dtos = _mapper.Map<IEnumerable<ReviewDto>>(reviews);
            foreach (ReviewDto dto in dtos)
            {
                dto.UserName = (await _userRepository.GetByIdAsync(Guid.Parse(dto.UserId))).UserName;
            }
            return dtos;
        }

        public async Task<ReviewDto> CreateReviewAsync(ReviewDto dto, Guid authorId, string authorName, string? authorAvatar)
        {
            var entity = _mapper.Map<Review>(dto);
            //entity.UserId = authorId.ToString();
            entity.Id = Guid.NewGuid().ToString();
            var created = await _reviewRepository.AddAsync(entity);
            await _reviewRepository.SaveChangesAsync();
            return _mapper.Map<ReviewDto>(created);
        }

        public async Task<ReviewDto?> UpdateReviewAsync(Guid id, ReviewDto dto, Guid userId)
        {
            var existing = await _reviewRepository.GetByIdAsync(id);
            if (existing == null) return null;
            if (existing.UserId != userId.ToString())
                throw new UnauthorizedAccessException("Only the author can update this review.");

            _mapper.Map(dto, existing);
            existing.Id = id.ToString();
            existing.UserId = userId.ToString();
            _reviewRepository.Update(existing);
            await _reviewRepository.SaveChangesAsync();
            return _mapper.Map<ReviewDto>(existing);
        }

        public async Task<bool> DeleteReviewAsync(Guid id, Guid userId)
        {
            var existing = await _reviewRepository.GetByIdAsync(id);
            if (existing == null) return false;
            if (existing.UserId != userId.ToString())
                throw new UnauthorizedAccessException("Only the author can delete this review.");

            _reviewRepository.Delete(existing);
            await _reviewRepository.SaveChangesAsync();
            return true;
        }
    }
}