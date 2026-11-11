package gg.overlab.backend.config.security;

import gg.overlab.backend.user.User;
import gg.overlab.backend.user.UserRepository;
import gg.overlab.backend.user.UserRole;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

@RequiredArgsConstructor
public class AdminSessionFilter extends OncePerRequestFilter {

    private static final String ADMIN_PREFIX = "/api/admin/";

    private final UserRepository userRepository;

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return !request.getRequestURI().startsWith(ADMIN_PREFIX);
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
