package gg.overlab.backend.user;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import gg.overlab.backend.user.auth.exception.InvalidTokenException;
import gg.overlab.backend.user.token.UserToken;
import gg.overlab.backend.user.token.UserTokenRepository;
import gg.overlab.backend.user.token.UserTokenService;
import gg.overlab.backend.user.token.UserTokenType;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

class UserTokenServiceTest {

    private final UserTokenRepository repository = mock(UserTokenRepository.class);
    private final UserTokenService service = new UserTokenService(repository);
    private final User user = AuthFixtures.user(1, "a@overlab.gg", UserRole.USER, false);

    @Test
    void storesOnlyTheHashOfTheIssuedToken() {
        String rawToken = service.issue(user, UserTokenType.EMAIL_VERIFICATION, Duration.ofHours(1));

        ArgumentCaptor<UserToken> saved = ArgumentCaptor.forClass(UserToken.class);
        verify(repository).save(saved.capture());
        assertThat(rawToken).hasSizeGreaterThan(30);
        assertThat(saved.getValue().getTokenHash()).hasSize(64).isNotEqualTo(rawToken);
        assertThat(saved.getValue().getExpiresAt()).isAfter(Instant.now());
    }

    @Test
    void consumesValidTokenOnce() {
        UserToken token = storedToken(Instant.now().plusSeconds(60), null);
        when(repository.findByHashAndTypeIn(any(), eq(List.of(UserTokenType.PASSWORD_RESET)))).thenReturn(Optional.of(token));

        User result = service.consume("raw", UserTokenType.PASSWORD_RESET);

        assertThat(result).isSameAs(user);
        assertThat(token.getUsedAt()).isNotNull();
    }

    @Test
    void rejectsAlreadyUsedToken() {
        UserToken token = storedToken(Instant.now().plusSeconds(60), Instant.now());
        when(repository.findByHashAndTypeIn(any(), any())).thenReturn(Optional.of(token));

        assertThatThrownBy(() -> service.consume("raw", UserTokenType.PASSWORD_RESET))
                .isInstanceOf(InvalidTokenException.class);
    }

    @Test
    void rejectsExpiredToken() {
        UserToken token = storedToken(Instant.now().minusSeconds(1), null);
        when(repository.findByHashAndTypeIn(any(), any())).thenReturn(Optional.of(token));

        assertThatThrownBy(() -> service.consume("raw", UserTokenType.EMAIL_VERIFICATION))
                .isInstanceOf(InvalidTokenException.class);
    }

    @Test
    void rejectsUnknownToken() {
        when(repository.findByHashAndTypeIn(any(), any())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.consume("raw", UserTokenType.REFRESH))
                .isInstanceOf(InvalidTokenException.class);
    }

    private UserToken storedToken(Instant expiresAt, Instant usedAt) {
        UserToken token = new UserToken();
        token.setUser(user);
        token.setExpiresAt(expiresAt);
        token.setUsedAt(usedAt);
        return token;
    }
}
