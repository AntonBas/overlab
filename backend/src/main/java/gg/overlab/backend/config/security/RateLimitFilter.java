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
    private static final String API_PREFIX = "/api/";
    private static final String STATS_PREFIX = "/api/stats";
    private static final Duration WINDOW = Duration.ofMinutes(1);

    private final StringRedisTemplate redisTemplate;
    private final AuthProperties authProperties;
    private final RateLimitProperties rateLimitProperties;

    public RateLimitFilter(StringRedisTemplate redisTemplate, AuthProperties authProperties,
                           RateLimitProperties rateLimitProperties) {
        this.redisTemplate = redisTemplate;
        this.authProperties = authProperties;
        this.rateLimitProperties = rateLimitProperties;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return resolveRule(request) == null;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        if (isLimitExceeded(request, resolveRule(request))) {
            response.setStatus(429);
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.getWriter().write("{\"status\":\"Too Many Requests\",\"statusCode\":429,\"timestamp\":\""
                    + Instant.now() + "\",\"message\":\"Too many requests, try again later\",\"path\":\""
                    + request.getRequestURI() + "\",\"subErrors\":[]}");
            return;
        }
        filterChain.doFilter(request, response);
    }

    private Rule resolveRule(HttpServletRequest request) {
        String path = request.getRequestURI();
        if ("POST".equals(request.getMethod()) && LIMITED_PATHS.contains(path)) {
            return new Rule(path, authProperties.rateLimitPerMinute());
        }
        if ("GET".equals(request.getMethod()) && path.startsWith(API_PREFIX)
                && !path.startsWith("/api/admin/") && !path.startsWith("/api/auth/")) {
            if (path.startsWith(STATS_PREFIX)) {
                return new Rule("stats", rateLimitProperties.statsPerMinute());
            }
            return new Rule("api", rateLimitProperties.apiPerMinute());
        }
        return null;
    }

    private boolean isLimitExceeded(HttpServletRequest request, Rule rule) {
        String key = "overlab:ratelimit:" + rule.bucket() + ":" + request.getRemoteAddr();
        try {
            Long count = redisTemplate.opsForValue().increment(key);
            if (count != null && count == 1L) {
                redisTemplate.expire(key, WINDOW);
            }
            return count != null && count > rule.limit();
        } catch (RuntimeException exception) {
            log.warn("Rate limit check skipped: {}", exception.getMessage());
            return false;
        }
    }

    private record Rule(String bucket, int limit) {
    }
}
