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
            List.of(PublicApiPaths.ADMIN_PREFIX, "/v3/api-docs", "/swagger-ui");

    private static final String AUTH_PREFIX = "/api/auth/";

    private final AdminAccessChecker accessChecker;

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        if (path.startsWith(AUTH_PREFIX)) {
            return true;
        }
        if (isAdminArea(path) || PublicApiPaths.isPersonal(path)) {
            return false;
        }
        return !isStateChanging(request.getMethod());
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
        return isAdminArea(path) || accessChecker.isActiveUser(sessionUser.id());
    }

    private static boolean isAdminArea(String path) {
        return ADMIN_PREFIXES.stream().anyMatch(path::startsWith);
    }

    private static boolean isStateChanging(String method) {
        return !"GET".equals(method) && !"HEAD".equals(method) && !"OPTIONS".equals(method);
    }
}
