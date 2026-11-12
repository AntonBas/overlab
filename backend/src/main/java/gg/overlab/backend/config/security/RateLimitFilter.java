package gg.overlab.backend.config.security;

import gg.overlab.backend.exception.core.TooManyRequestsException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.Duration;
import java.util.Set;
import org.springframework.http.HttpHeaders;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.servlet.HandlerExceptionResolver;

public class RateLimitFilter extends OncePerRequestFilter {

    private static final Set<String> LIMITED_PATHS = Set.of(
            "/api/auth/register",
            "/api/auth/login",
            "/api/auth/forgot-password",
            "/api/auth/reset-password",
            "/api/auth/resend-verification",
            "/api/feedback",
            "/api/business");
    private static final String REFRESH_PATH = "/api/auth/refresh";
    private static final String STATS_PREFIX = "/api/stats";
    private static final Duration WINDOW = Duration.ofMinutes(1);

    private final RateLimitCounter counter;
    private final AuthProperties authProperties;
    private final RateLimitProperties rateLimitProperties;
    private final HandlerExceptionResolver exceptionResolver;

    public RateLimitFilter(RateLimitCounter counter, AuthProperties authProperties,
                           RateLimitProperties rateLimitProperties, HandlerExceptionResolver exceptionResolver) {
        this.counter = counter;
        this.authProperties = authProperties;
        this.rateLimitProperties = rateLimitProperties;
        this.exceptionResolver = exceptionResolver;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return resolveRule(request) == null;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        if (isLimitExceeded(request, resolveRule(request))) {
            response.setHeader(HttpHeaders.RETRY_AFTER, String.valueOf(WINDOW.toSeconds()));
            exceptionResolver.resolveException(request, response, null,
                    new TooManyRequestsException("Too many requests, try again later"));
            return;
        }
        filterChain.doFilter(request, response);
    }

    private Rule resolveRule(HttpServletRequest request) {
        String path = request.getRequestURI();
        if ("POST".equals(request.getMethod()) && LIMITED_PATHS.contains(path)) {
            return new Rule(path, authProperties.rateLimitPerMinute());
        }
        if ("POST".equals(request.getMethod()) && REFRESH_PATH.equals(path)) {
            return new Rule("refresh", rateLimitProperties.apiPerMinute());
        }
        if (PublicApiPaths.isPublicRead(request.getMethod(), path)) {
            if (path.startsWith(STATS_PREFIX)) {
                return new Rule("stats", rateLimitProperties.statsPerMinute());
            }
            return new Rule("api", rateLimitProperties.apiPerMinute());
        }
        return null;
    }

    private boolean isLimitExceeded(HttpServletRequest request, Rule rule) {
        String key = "overlab:ratelimit:" + rule.bucket() + ":" + request.getRemoteAddr();
        return counter.increment(key, WINDOW) > rule.limit();
    }

    private record Rule(String bucket, int limit) {
    }
}
