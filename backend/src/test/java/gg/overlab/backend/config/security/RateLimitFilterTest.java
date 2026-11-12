package gg.overlab.backend.config.security;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import gg.overlab.backend.exception.core.TooManyRequestsException;
import gg.overlab.backend.user.AuthFixtures;
import jakarta.servlet.FilterChain;
import java.time.Duration;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.web.servlet.HandlerExceptionResolver;

class RateLimitFilterTest {

    private final RateLimitCounter counter = mock(RateLimitCounter.class);
    private final HandlerExceptionResolver resolver = mock(HandlerExceptionResolver.class);
    private final FilterChain chain = mock(FilterChain.class);
    private final RateLimitFilter filter = new RateLimitFilter(counter, AuthFixtures.properties(),
            new RateLimitProperties(100, 200), resolver);

    private MockHttpServletRequest request(String method, String path) {
        MockHttpServletRequest request = new MockHttpServletRequest(method, path);
        request.setRemoteAddr("203.0.113.5");
        return request;
    }

    @Test
    void anAuthPostWithinTheLimitPassesThrough() throws Exception {
        when(counter.increment(anyString(), any(Duration.class))).thenReturn(10L);
        MockHttpServletRequest request = request("POST", "/api/auth/login");
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(request, response, chain);

        verify(chain).doFilter(request, response);
        verifyNoInteractions(resolver);
    }

    @Test
    void anAuthPostOverTheLimitIsAnsweredWithTooManyRequestsAndRetryAfter() throws Exception {
        when(counter.increment(anyString(), any(Duration.class))).thenReturn(11L);
        MockHttpServletRequest request = request("POST", "/api/auth/login");
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(request, response, chain);

        verify(chain, never()).doFilter(any(), any());
        verify(resolver).resolveException(eq(request), eq(response), eq(null), any(TooManyRequestsException.class));
        assertThat(response.getHeader("Retry-After")).isEqualTo("60");
    }

    @Test
    void everyLimitedPathHasItsOwnCounterPerAddress() throws Exception {
        when(counter.increment(anyString(), any(Duration.class))).thenReturn(1L);

        for (String path : new String[] {"/api/auth/register", "/api/auth/login", "/api/auth/forgot-password",
                "/api/auth/reset-password", "/api/auth/resend-verification", "/api/feedback", "/api/business"}) {
            filter.doFilter(request("POST", path), new MockHttpServletResponse(), chain);
        }

        ArgumentCaptor<String> keys = ArgumentCaptor.forClass(String.class);
        verify(counter, org.mockito.Mockito.times(7)).increment(keys.capture(), any(Duration.class));
        assertThat(keys.getAllValues()).doesNotHaveDuplicates()
                .allMatch(key -> key.startsWith("overlab:ratelimit:") && key.endsWith(":203.0.113.5"));
    }

    @Test
    void refreshUsesTheGeneralApiLimit() throws Exception {
        when(counter.increment(anyString(), any(Duration.class))).thenReturn(101L);
        MockHttpServletRequest request = request("POST", "/api/auth/refresh");
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(request, response, chain);

        verify(resolver).resolveException(eq(request), eq(response), eq(null), any(TooManyRequestsException.class));
    }

    @Test
    void statsReadsHaveTheirOwnHigherLimit() throws Exception {
        when(counter.increment(eq("overlab:ratelimit:stats:203.0.113.5"), any(Duration.class))).thenReturn(150L);
        MockHttpServletRequest request = request("GET", "/api/stats");

        filter.doFilter(request, new MockHttpServletResponse(), chain);

        verify(chain).doFilter(eq(request), any());
        verifyNoInteractions(resolver);
    }

    @Test
    void otherPublicReadsUseTheApiLimit() throws Exception {
        when(counter.increment(eq("overlab:ratelimit:api:203.0.113.5"), any(Duration.class))).thenReturn(101L);
        MockHttpServletRequest request = request("GET", "/api/heroes");
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(request, response, chain);

        verify(resolver).resolveException(eq(request), eq(response), eq(null), any(TooManyRequestsException.class));
    }

    @Test
    void personalAdminAndNonApiRequestsAreNotCounted() throws Exception {
        for (String[] call : new String[][] {{"GET", "/api/me/favorites"}, {"GET", "/api/admin/users"},
                {"GET", "/api/auth/me"}, {"PUT", "/api/me/profile"}, {"GET", "/media/maps/a.png"}}) {
            filter.doFilter(request(call[0], call[1]), new MockHttpServletResponse(), chain);
        }

        verifyNoInteractions(counter);
    }
}
