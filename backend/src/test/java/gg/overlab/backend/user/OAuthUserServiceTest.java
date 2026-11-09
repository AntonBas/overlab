package gg.overlab.backend.user;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import gg.overlab.backend.user.auth.OAuthUserService;
import gg.overlab.backend.user.auth.exception.EmailAlreadyUsedException;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class OAuthUserServiceTest {

    private static final String SUBJECT = "google-subject";
    private static final String EMAIL = "ana@overlab.gg";

    private UserRepository userRepository;
    private OAuthUserService service;

    @BeforeEach
    void setUp() {
        userRepository = mock(UserRepository.class);
        when(userRepository.findByGoogleSubject(any())).thenReturn(Optional.empty());
        when(userRepository.findByEmailIgnoreCase(any())).thenReturn(Optional.empty());
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));
        service = new OAuthUserService(userRepository);
    }

    @Test
    void createsVerifiedGoogleAccountForNewEmail() {
        User created = service.findOrCreate(SUBJECT, "Ana@Overlab.gg", "Ana");

        assertThat(created.getEmail()).isEqualTo(EMAIL);
        assertThat(created.getGoogleSubject()).isEqualTo(SUBJECT);
        assertThat(created.getProvider()).isEqualTo(AuthProvider.GOOGLE);
        assertThat(created.isEmailVerified()).isTrue();
    }

    @Test
    void returnsAccountAlreadyLinkedToSubject() {
        User linked = localUser(true);
        linked.setGoogleSubject(SUBJECT);
        when(userRepository.findByGoogleSubject(SUBJECT)).thenReturn(Optional.of(linked));

        assertThat(service.findOrCreate(SUBJECT, EMAIL, "Ana")).isSameAs(linked);
    }

    @Test
    void linksVerifiedLocalAccountAndKeepsPassword() {
        User existing = localUser(true);
        when(userRepository.findByEmailIgnoreCase(EMAIL)).thenReturn(Optional.of(existing));

        User result = service.findOrCreate(SUBJECT, EMAIL, "Ana");

        assertThat(result.getGoogleSubject()).isEqualTo(SUBJECT);
        assertThat(result.getPasswordHash()).isEqualTo("hash");
        assertThat(result.getProvider()).isEqualTo(AuthProvider.LOCAL);
    }

    @Test
    void linksUnverifiedLocalAccountAndDropsPassword() {
        User existing = localUser(false);
        when(userRepository.findByEmailIgnoreCase(EMAIL)).thenReturn(Optional.of(existing));

        User result = service.findOrCreate(SUBJECT, EMAIL, "Ana");

        assertThat(result.getGoogleSubject()).isEqualTo(SUBJECT);
        assertThat(result.getPasswordHash()).isNull();
        assertThat(result.isEmailVerified()).isTrue();
    }

    @Test
    void rejectsEmailLinkedToAnotherGoogleAccount() {
        User existing = localUser(true);
        existing.setGoogleSubject("other-subject");
        when(userRepository.findByEmailIgnoreCase(EMAIL)).thenReturn(Optional.of(existing));

        assertThatThrownBy(() -> service.findOrCreate(SUBJECT, EMAIL, "Ana"))
                .isInstanceOf(EmailAlreadyUsedException.class);
    }

    private User localUser(boolean emailVerified) {
        User user = new User();
        user.setEmail(EMAIL);
        user.setDisplayName("Ana");
        user.setPasswordHash("hash");
        user.setProvider(AuthProvider.LOCAL);
        user.setEmailVerified(emailVerified);
        return user;
    }
}
