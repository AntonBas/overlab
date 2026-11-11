package gg.overlab.backend.config.security;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import gg.overlab.backend.user.User;
import gg.overlab.backend.user.UserRepository;
import gg.overlab.backend.user.UserRole;
import jakarta.servlet.FilterChain;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

class AdminSessionFilterTest {

    private final UserRepository userRepository = mock(UserRepository.class);
    private final FilterChain chain = mock(FilterChain.class);
    private final AdminSessionFilter filter = new AdminSessionFilter(userRepository);

    @AfterEach
    void clearContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void ignoresRequestsOutsideTheAdminArea() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/heroes");
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(request, response, chain);

        verify(chain).doFilter(request, response);
        verifyNoInteractions(userRepository);
    }

    @Test
    void letsAnEnabledAdminThrough() throws Exception {
        authenticate(1L);
        when(userRepository.findById(1L)).thenReturn(Optional.of(user(UserRole.ADMIN, true)));
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/admin/users");
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(request, response, chain);

        verify(chain).doFilter(request, response);
    }

    @Test
    void leavesNonAdminTokensToTheAuthorizationRules() throws Exception {
        AuthenticatedUser principal = new AuthenticatedUser(2L, "user@overlab.gg", UserRole.USER);
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(principal, null,
                List.of(new SimpleGrantedAuthority("ROLE_USER"))));
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/admin/users");
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(request, response, chain);

        verify(chain).doFilter(request, response);
        verifyNoInteractions(userRepository);
    }

    @Test
    void rejectsADisabledAdmin() throws Exception {
        assertRejected(Optional.of(user(UserRole.ADMIN, false)));
    }

    @Test
    void rejectsAnAdminDemotedAfterTheTokenWasIssued() throws Exception {
        assertRejected(Optional.of(user(UserRole.USER, true)));
    }

    @Test
    void rejectsADeletedAdmin() throws Exception {
        assertRejected(Optional.empty());
    }

    private void assertRejected(Optional<User> stored) throws Exception {
        authenticate(1L);
        when(userRepository.findById(1L)).thenReturn(stored);
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/admin/users");
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(request, response, chain);

        assertThat(response.getStatus()).isEqualTo(401);
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        verifyNoInteractions(chain);
    }

    private void authenticate(long userId) {
        AuthenticatedUser principal = new AuthenticatedUser(userId, "admin@overlab.gg", UserRole.ADMIN);
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(principal, null,
                List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))));
    }

    private User user(UserRole role, boolean enabled) {
        User user = new User();
        user.setRole(role);
        user.setEnabled(enabled);
        return user;
    }
}
