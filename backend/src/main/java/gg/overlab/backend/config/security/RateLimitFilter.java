package gg.overlab.backend.config.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.Duration;
import java.time.Instant;
import java.util.Set;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.MediaType;
import org.springframework.web.filter.OncePerRequestFilter;

@Slf4j
public class RateLimitFilter extends OncePerRequestFilter {

    private static final Set<String> LIMITED_PATHS = Set.of(
            "/api/auth/register",
            "/api/auth/login",
            "/api/auth/forgot-password",
            "/api/auth/reset-password",
            "/api/auth/resend-verification");
    private static final Duration WINDOW = Duration.ofMinutes(1);

    private final StringRedisTemplate redisTemplate;
    private final AuthProperties properties;

    public RateLimitFilter(StringRedisTemplate redisTemplate, AuthProperties properties) {
        this.redisTemplate = redisTemplate;
        this.properties = properties;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return !"POST".equals(request.getMethod()) || !LIMITED_PATHS.contains(request.getRequestURI());
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        if (isLimitExceeded(request)) {
            response.setStatus(429);
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.getWriter().write("{\"status\":\"Too Many Requests\",\"statusCode\":429,\"timestamp\":\""
                    + Instant.now() + "\",\"message\":\"Too many requests, try again later\",\"path\":\""
                    + request.getRequestURI() + "\",\"subErrors\":[]}");
            return;
        }
        filterChain.doFilter(request, response);
    }

    private boolean isLimitExceeded(HttpServletRequest request) {
        String key = "overlab:ratelimit:" + request.getRequestURI() + ":" + request.getRemoteAddr();
        try {
            Long count = redisTemplate.opsForValue().increment(key);
            if (count != null && count == 1L) {
                redisTemplate.expire(key, WINDOW);
            }
            return count != null && count > properties.rateLimitPerMinute();
        } catch (RuntimeException exception) {
            log.warn("Rate limit check skipped: {}", exception.getMessage());
            return false;
        }
    }
}
