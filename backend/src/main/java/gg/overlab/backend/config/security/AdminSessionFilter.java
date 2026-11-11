package gg.overlab.backend.config.security;

import gg.overlab.backend.user.User;
import gg.overlab.backend.user.UserRepository;
import gg.overlab.backend.user.UserRole;
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

    private static final List<String> ADMIN_PREFIXES = List.of("/api/admin/", "/v3/api-docs", "/swagger-ui");

    private final UserRepository userRepository;

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
                && sessionUser.role() == UserRole.ADMIN && !isCurrentAdmin(sessionUser)) {
            SecurityContextHolder.clearContext();
            response.setStatus(HttpStatus.UNAUTHORIZED.value());
            return;
        }
        filterChain.doFilter(request, response);
    }

    private boolean isCurrentAdmin(AuthenticatedUser sessionUser) {
        return userRepository.findById(sessionUser.id())
                .filter(User::isEnabled)
                .map(User::getRole)
                .filter(UserRole.ADMIN::equals)
                .isPresent();
    }
}
