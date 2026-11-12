package gg.overlab.backend.config.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

@RequiredArgsConstructor
public class AdminSessionFilter extends OncePerRequestFilter {

    private static final List<String> ADMIN_PREFIXES =
            List.of(PublicApiPaths.ADMIN_PREFIX, "/v3/api-docs", "/swagger-ui", PublicApiPaths.PERSONAL_PREFIX);

    private final AdminAccessChecker accessChecker;

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return ADMIN_PREFIXES.stream().noneMatch(path::startsWith);
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof AuthenticatedUser sessionUser
                && !isStillActive(sessionUser, request.getRequestURI())) {
            SecurityContextHolder.clearContext();
            response.setStatus(HttpStatus.UNAUTHORIZED.value());
            return;
        }
        filterChain.doFilter(request, response);
    }

    private boolean isStillActive(AuthenticatedUser sessionUser, String path) {
        if (sessionUser.role() == UserRole.ADMIN) {
            return accessChecker.isActiveAdmin(sessionUser.id());
        }
        return !path.startsWith(PublicApiPaths.PERSONAL_PREFIX) || accessChecker.isActiveUser(sessionUser.id());
    }
}
