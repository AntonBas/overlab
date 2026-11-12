package gg.overlab.backend.user.auth;

import gg.overlab.backend.config.security.UserRole;
import gg.overlab.backend.exception.core.EmailAlreadyUsedException;
import gg.overlab.backend.user.AuthProvider;
import gg.overlab.backend.user.User;
import gg.overlab.backend.user.UserRepository;
import java.util.Locale;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class OAuthUserService {

    private static final int DISPLAY_NAME_MAX_LENGTH = 64;

    private final UserRepository userRepository;

    @Transactional
    public User findOrCreate(String googleSubject, String email, String name) {
        String normalizedEmail = email.trim().toLowerCase(Locale.ROOT);
        return userRepository.findByGoogleSubject(googleSubject)
                .or(() -> userRepository.findByEmailIgnoreCase(normalizedEmail)
                        .map(existing -> link(existing, googleSubject)))
                .orElseGet(() -> create(googleSubject, normalizedEmail, name));
    }

    private User link(User existing, String googleSubject) {
        if (existing.getGoogleSubject() != null) {
            throw new EmailAlreadyUsedException();
        }
        if (!existing.isEmailVerified()) {
            existing.setPasswordHash(null);
            existing.setEmailVerified(true);
        }
        existing.setGoogleSubject(googleSubject);
        return userRepository.save(existing);
    }

    private User create(String googleSubject, String normalizedEmail, String name) {
        User user = new User();
        user.setEmail(normalizedEmail);
        user.setDisplayName(displayNameFor(name, normalizedEmail));
        user.setRole(UserRole.USER);
        user.setProvider(AuthProvider.GOOGLE);
        user.setGoogleSubject(googleSubject);
        user.setEmailVerified(true);
        return userRepository.save(user);
    }

    private String displayNameFor(String name, String email) {
        String candidate = name == null || name.isBlank() ? email.substring(0, email.indexOf('@')) : name.trim();
        return candidate.length() > DISPLAY_NAME_MAX_LENGTH ? candidate.substring(0, DISPLAY_NAME_MAX_LENGTH) : candidate;
    }
}
