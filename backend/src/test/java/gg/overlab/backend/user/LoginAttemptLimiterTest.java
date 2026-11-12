package gg.overlab.backend.user;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import gg.overlab.backend.config.security.RateLimitCounter;
import gg.overlab.backend.exception.core.TooManyRequestsException;
import gg.overlab.backend.user.auth.LoginAttemptLimiter;
import java.time.Duration;
import org.junit.jupiter.api.Test;

class LoginAttemptLimiterTest {

    private final RateLimitCounter counter = mock(RateLimitCounter.class);
    private final LoginAttemptLimiter limiter = new LoginAttemptLimiter(counter);

    @Test
    void allowsAttemptsBelowTheLimit() {
        when(counter.current(anyString())).thenReturn(9L);

        assertThatCode(() -> limiter.requireAllowed("ana@overlab.gg")).doesNotThrowAnyException();
    }

    @Test
    void blocksAfterTenFailures() {
        when(counter.current(anyString())).thenReturn(10L);

        assertThatThrownBy(() -> limiter.requireAllowed("ana@overlab.gg"))
                .isInstanceOf(TooManyRequestsException.class);
    }

    @Test
    void storesOnlyAHashOfTheEmail() {
        limiter.recordFailure("ana@overlab.gg");

        verify(counter, org.mockito.Mockito.times(2)).increment(org.mockito.ArgumentMatchers.argThat(key ->
                key.startsWith("overlab:login-failures:") && !key.contains("ana")), any(Duration.class));
    }

    @Test
    void blocksOnlyTheAddressAtTenFailuresAndEveryoneAtFifty() {
        when(counter.current(anyString())).thenReturn(10L, 0L);

        assertThatThrownBy(() -> limiter.requireAllowed("ana@overlab.gg"))
                .isInstanceOf(TooManyRequestsException.class);

        when(counter.current(anyString())).thenReturn(0L, 50L);

        assertThatThrownBy(() -> limiter.requireAllowed("ana@overlab.gg"))
                .isInstanceOf(TooManyRequestsException.class);
    }

    @Test
    void resetClearsTheCounter() {
        limiter.reset("ana@overlab.gg");

        verify(counter).reset(org.mockito.ArgumentMatchers.argThat(key -> key.startsWith("overlab:login-failures:")));
    }
}
