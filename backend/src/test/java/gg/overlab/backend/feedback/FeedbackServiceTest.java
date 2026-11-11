package gg.overlab.backend.feedback;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import gg.overlab.backend.exception.core.BadRequestException;
import gg.overlab.backend.exception.core.EntityNotFoundException;
import gg.overlab.backend.feedback.dto.BusinessMessageRequest;
import gg.overlab.backend.feedback.dto.FeedbackRequest;
import gg.overlab.backend.notification.EmailService;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

class FeedbackServiceTest {

    private final SiteFeedbackRepository repository = mock(SiteFeedbackRepository.class);
    private final EmailService emailService = mock(EmailService.class);
    private final FeedbackService service = new FeedbackService(repository, emailService);

    @Test
    void storesTrimmedFeedbackWithSafePagePath() {
        service.submit(5L, new FeedbackRequest(FeedbackType.BUG, "  something is broken here  ", " /heroes/ana "));

        SiteFeedback saved = savedFeedback();
        assertThat(saved.getMessage()).isEqualTo("something is broken here");
        assertThat(saved.getPagePath()).isEqualTo("/heroes/ana");
        assertThat(saved.getUserId()).isEqualTo(5L);
    }

    @Test
    void dropsPagePathsThatAreNotLocal() {
        service.submit(null, new FeedbackRequest(FeedbackType.BUG, "something is broken here", "//evil.example"));

        assertThat(savedFeedback().getPagePath()).isNull();
    }

    @Test
    void businessMessagesCannotBeSentThroughTheGeneralForm() {
        assertThatThrownBy(() -> service.submit(1L,
                new FeedbackRequest(FeedbackType.BUSINESS, "a business message here", "/")))
                .isInstanceOf(BadRequestException.class);
        verify(repository, never()).save(any());
    }

    @Test
    void limitsTheNumberOfOpenMessagesPerUser() {
        when(repository.countByUserIdAndStatus(1L, FeedbackStatus.NEW)).thenReturn((long) FeedbackService.MAX_OPEN_PER_USER);

        assertThatThrownBy(() -> service.submit(1L,
                new FeedbackRequest(FeedbackType.BUG, "something is broken here", "/")))
                .isInstanceOf(BadRequestException.class);
        verify(repository, never()).save(any());
    }

    @Test
    void anonymousUsersAreNotCheckedAgainstTheOpenLimit() {
        service.submit(null, new FeedbackRequest(FeedbackType.BUG, "something is broken here", "/"));

        verify(repository, never()).countByUserIdAndStatus(any(), any());
    }

    @Test
    void businessMessageIsStoredAndEmailed() {
        service.submitBusiness(null, new BusinessMessageRequest(" Ana ", " ana@example.com ",
                " let us talk about ads "));

        SiteFeedback saved = savedFeedback();
        assertThat(saved.getType()).isEqualTo(FeedbackType.BUSINESS);
        assertThat(saved.getContactName()).isEqualTo("Ana");
        assertThat(saved.getContactEmail()).isEqualTo("ana@example.com");
        assertThat(saved.getPagePath()).isEqualTo("/business");
        verify(emailService).sendBusinessInquiry("Ana", "ana@example.com", "let us talk about ads");
    }

    @Test
    void resolvingSetsTheResolutionTimeAndReopeningClearsIt() {
        SiteFeedback feedback = new SiteFeedback();
        when(repository.findById(3L)).thenReturn(Optional.of(feedback));

        service.changeStatus(3L, FeedbackStatus.RESOLVED);
        assertThat(feedback.getResolvedAt()).isNotNull();

        service.changeStatus(3L, FeedbackStatus.NEW);
        assertThat(feedback.getResolvedAt()).isNull();
    }

    @Test
    void changingStatusOfUnknownFeedbackIsNotFound() {
        when(repository.findById(9L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.changeStatus(9L, FeedbackStatus.RESOLVED))
                .isInstanceOf(EntityNotFoundException.class);
    }

    private SiteFeedback savedFeedback() {
        ArgumentCaptor<SiteFeedback> captor = ArgumentCaptor.forClass(SiteFeedback.class);
        verify(repository).save(captor.capture());
        return captor.getValue();
    }
}
