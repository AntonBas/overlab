package gg.overlab.backend.feedback;

import gg.overlab.backend.exception.core.BadRequestException;
import gg.overlab.backend.exception.core.EntityNotFoundException;
import gg.overlab.backend.feedback.dto.FeedbackAdminDto;
import gg.overlab.backend.feedback.dto.FeedbackDto;
import gg.overlab.backend.feedback.dto.FeedbackRequest;
import java.time.Instant;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class FeedbackService {

    public static final int MAX_OPEN_PER_USER = 20;
    public static final int MAX_ADMIN_ROWS = 500;

    private final SiteFeedbackRepository feedbackRepository;

    @Transactional
    public void submit(Long userId, FeedbackRequest request) {
        if (userId != null
                && feedbackRepository.countByUserIdAndStatus(userId, FeedbackStatus.NEW) >= MAX_OPEN_PER_USER) {
            throw new BadRequestException("You already have " + MAX_OPEN_PER_USER
                    + " messages waiting for review, please wait until some are processed");
        }
        SiteFeedback feedback = new SiteFeedback();
        feedback.setType(request.type());
        feedback.setMessage(request.message().trim());
        feedback.setPagePath(normalizePath(request.pagePath()));
        feedback.setUserId(userId);
        feedbackRepository.save(feedback);
    }

    @Transactional(readOnly = true)
    public List<FeedbackDto> export(Long userId) {
        return feedbackRepository.findAllByUserIdOrderByIdAsc(userId).stream()
                .map(feedback -> new FeedbackDto(feedback.getType(), feedback.getMessage(), feedback.getPagePath(),
                        feedback.getStatus(), feedback.getCreatedAt()))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<FeedbackAdminDto> findForAdmin(FeedbackStatus status) {
        return feedbackRepository.findForAdmin(status, PageRequest.of(0, MAX_ADMIN_ROWS));
    }

    @Transactional
    public void changeStatus(Long id, FeedbackStatus status) {
        SiteFeedback feedback = feedbackRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Feedback", id));
        feedback.setStatus(status);
        feedback.setResolvedAt(status == FeedbackStatus.NEW ? null : Instant.now());
    }

    private String normalizePath(String path) {
        if (path == null) {
            return null;
        }
        String trimmed = path.trim();
        if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
            return null;
        }
        return trimmed;
    }
}
