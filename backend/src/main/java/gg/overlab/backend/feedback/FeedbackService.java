package gg.overlab.backend.feedback;

import gg.overlab.backend.audit.AuditEntityType;
import gg.overlab.backend.audit.AuditService;
import gg.overlab.backend.config.security.RateLimitCounter;
import gg.overlab.backend.exception.core.BadRequestException;
import gg.overlab.backend.exception.core.EntityNotFoundException;
import gg.overlab.backend.exception.core.TooManyRequestsException;
import gg.overlab.backend.feedback.dto.BusinessMessageRequest;
import gg.overlab.backend.feedback.dto.FeedbackAdminDto;
import gg.overlab.backend.feedback.dto.FeedbackDto;
import gg.overlab.backend.feedback.dto.FeedbackRequest;
import gg.overlab.backend.notification.EmailService;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

@Service
@RequiredArgsConstructor
public class FeedbackService {

    public static final int MAX_OPEN_PER_USER = 20;
    public static final int MAX_ADMIN_ROWS = 500;
    public static final int MAX_OPEN_ANONYMOUS = 200;
    public static final int MAX_OPEN_PER_CONTACT = 5;
    public static final int MAX_ANONYMOUS_PER_ADDRESS_PER_HOUR = 5;
    private static final Duration ANONYMOUS_WINDOW = Duration.ofHours(1);
    private static final String ANONYMOUS_KEY_PREFIX = "overlab:anonymous-feedback:";

    private final SiteFeedbackRepository feedbackRepository;
    private final EmailService emailService;
    private final FeedbackAuthors feedbackAuthors;
    private final RateLimitCounter rateLimitCounter;
    private final AuditService auditService;

    @Transactional
    public void submit(Long userId, FeedbackRequest request) {
        if (request.type() == FeedbackType.BUSINESS) {
            throw new BadRequestException("Business messages are sent from the Business page");
        }
        requireUserCapacity(userId);
        requireAnonymousCapacity(userId);
        SiteFeedback feedback = new SiteFeedback();
        feedback.setType(request.type());
        feedback.setMessage(request.message().trim());
        feedback.setPagePath(normalizePath(request.pagePath()));
        feedback.setUserId(userId);
        feedbackRepository.save(feedback);
    }

    @Transactional
    public void submitBusiness(Long userId, BusinessMessageRequest request) {
        requireAnonymousCapacity(userId);
        requireUserCapacity(userId);
        if (feedbackRepository.countByContactEmailIgnoreCaseAndStatus(request.email().trim(), FeedbackStatus.NEW)
                >= MAX_OPEN_PER_CONTACT) {
            throw new BadRequestException("You already have " + MAX_OPEN_PER_CONTACT
                    + " messages waiting for review, please wait for an answer");
        }
        SiteFeedback feedback = new SiteFeedback();
        feedback.setType(FeedbackType.BUSINESS);
        feedback.setMessage(request.message().trim());
        feedback.setContactName(request.name().trim());
        feedback.setContactEmail(request.email().trim());
        feedback.setPagePath("/business");
        feedback.setUserId(userId);
        feedbackRepository.save(feedback);
        emailService.sendBusinessInquiry(feedback.getContactName(), feedback.getContactEmail(),
                feedback.getMessage());
    }

    @Transactional
    public void clearContactDetails(Long userId) {
        feedbackRepository.clearContactDetails(userId);
    }

    @Transactional(readOnly = true)
    public List<FeedbackDto> export(Long userId) {
        return feedbackRepository.findAllByUserIdOrderByIdAsc(userId).stream()
                .map(feedback -> new FeedbackDto(feedback.getType(), feedback.getMessage(), feedback.getPagePath(),
                        feedback.getStatus(), feedback.getCreatedAt(), feedback.getContactName(),
                        feedback.getContactEmail()))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<FeedbackAdminDto> findForAdmin(FeedbackStatus status) {
        List<SiteFeedback> rows = feedbackRepository.findByStatusOrderByCreatedAtDesc(status,
                PageRequest.of(0, MAX_ADMIN_ROWS));
        Set<Long> userIds = rows.stream().map(SiteFeedback::getUserId).filter(Objects::nonNull)
                .collect(Collectors.toSet());
        Map<Long, String> names = userIds.isEmpty() ? Map.of() : feedbackAuthors.displayNames(userIds);
        return rows.stream().map(row -> toAdminDto(row, names)).toList();
    }

    @Transactional
    public void changeStatus(Long id, FeedbackStatus status) {
        SiteFeedback feedback = feedbackRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Feedback", id));
        FeedbackStatusSnapshot before = new FeedbackStatusSnapshot(feedback.getStatus());
        feedback.setStatus(status);
        feedback.setResolvedAt(status == FeedbackStatus.NEW ? null : Instant.now());
        auditService.logUpdate(AuditEntityType.FEEDBACK, id, before, new FeedbackStatusSnapshot(status));
    }

    private void requireUserCapacity(Long userId) {
        if (userId != null
                && feedbackRepository.countByUserIdAndStatus(userId, FeedbackStatus.NEW) >= MAX_OPEN_PER_USER) {
            throw new BadRequestException("You already have " + MAX_OPEN_PER_USER
                    + " messages waiting for review, please wait until some are processed");
        }
    }

    private void requireAnonymousCapacity(Long userId) {
        if (userId == null && anonymousAddressExceeded()) {
            throw new TooManyRequestsException("Too many messages from your address, try again later");
        }
        if (userId == null
                && feedbackRepository.countByUserIdIsNullAndStatus(FeedbackStatus.NEW) >= MAX_OPEN_ANONYMOUS) {
            throw new TooManyRequestsException("Too many messages are waiting for review, try again later");
        }
    }

    private String authorName(Long userId, Map<Long, String> names) {
        return userId == null ? null : names.get(userId);
    }

    private FeedbackAdminDto toAdminDto(SiteFeedback feedback, Map<Long, String> names) {
        String author = feedback.getContactName() != null ? feedback.getContactName()
                : authorName(feedback.getUserId(), names);
        return new FeedbackAdminDto(feedback.getId(), feedback.getType(), feedback.getMessage(),
                feedback.getPagePath(), author, feedback.getContactEmail(), feedback.getStatus(),
                feedback.getCreatedAt(), feedback.getResolvedAt());
    }

    private String normalizePath(String path) {
        if (path == null) {
            return null;
        }
        String trimmed = path.trim();
        if (!trimmed.startsWith("/") || trimmed.startsWith("//") || trimmed.indexOf('\\') >= 0) {
            return null;
        }
        return trimmed;
    }

    private boolean anonymousAddressExceeded() {
        if (RequestContextHolder.getRequestAttributes() instanceof ServletRequestAttributes attributes) {
            String key = ANONYMOUS_KEY_PREFIX + attributes.getRequest().getRemoteAddr();
            return rateLimitCounter.increment(key, ANONYMOUS_WINDOW) > MAX_ANONYMOUS_PER_ADDRESS_PER_HOUR;
        }
        return false;
    }
}
