package gg.overlab.backend.user.auth;

import gg.overlab.backend.user.AuthProvider;
import gg.overlab.backend.user.User;
import gg.overlab.backend.user.UserRepository;
import gg.overlab.backend.user.UserRole;
import gg.overlab.backend.user.auth.exception.EmailAlreadyUsedException;
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
    public User findOrCreate(AuthProvider provider, String providerId, String email, String name) {
        return userRepository.findByProviderAndProviderId(provider, providerId)
                .orElseGet(() -> create(provider, providerId, email, name));
    }

    private User create(AuthProvider provider, String providerId, String email, String name) {
        String normalizedEmail = email.trim().toLowerCase(Locale.ROOT);
        if (userRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            throw new EmailAlreadyUsedException();
        }
        User user = new User();
        user.setEmail(normalizedEmail);
        user.setDisplayName(displayNameFor(name, normalizedEmail));
        user.setRole(UserRole.USER);
        user.setProvider(provider);
        user.setProviderId(providerId);
        user.setEmailVerified(true);
        return userRepository.save(user);
    }

    private String displayNameFor(String name, String email) {
        String candidate = name == null || name.isBlank() ? email.substring(0, email.indexOf('@')) : name.trim();
        return candidate.length() > DISPLAY_NAME_MAX_LENGTH ? candidate.substring(0, DISPLAY_NAME_MAX_LENGTH) : candidate;
    }
}
