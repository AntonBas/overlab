package gg.overlab.backend.user;

import gg.overlab.backend.feedback.FeedbackAuthors;
import java.util.Collection;
import java.util.Map;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
public class UserFeedbackAuthors implements FeedbackAuthors {

    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public Map<Long, String> displayNames(Collection<Long> userIds) {
        return userRepository.findAllById(userIds).stream()
                .collect(Collectors.toMap(User::getId, User::getDisplayName));
    }
}
