package gg.overlab.backend.user.account;

import gg.overlab.backend.exception.core.EntityNotFoundException;
import gg.overlab.backend.feedback.FeedbackService;
import gg.overlab.backend.hero.relation.feedback.RelationFeedbackService;
import gg.overlab.backend.user.User;
import gg.overlab.backend.user.UserRepository;
import gg.overlab.backend.user.account.dto.AccountExportDto;
import gg.overlab.backend.user.personal.PersonalService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AccountExportService {

    private final UserRepository userRepository;
    private final PersonalService personalService;
    private final RelationFeedbackService relationFeedbackService;
    private final FeedbackService feedbackService;

    @Transactional(readOnly = true)
    public AccountExportDto export(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User", userId));
        return new AccountExportDto(user.getId(), user.getEmail(), user.getDisplayName(), user.getRole(),
                user.getProvider(), user.isEmailVerified(), user.getCreatedAt(), user.getLastLoginAt(),
                personalService.favorites(userId), relationFeedbackService.votes(userId),
                feedbackService.export(userId),
                personalService.preferences(userId));
    }
}
