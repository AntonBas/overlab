package gg.overlab.backend.config.security;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import jakarta.servlet.FilterChain;
import java.util.List;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

class AdminSessionFilterTest {

    private final AdminAccessChecker accessChecker = mock(AdminAccessChecker.class);
    private final FilterChain chain = mock(FilterChain.class);
    private final AdminSessionFilter filter = new AdminSessionFilter(accessChecker);

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
        verifyNoInteractions(accessChecker);
    }

    @Test
    void letsAnActiveAdminThrough() throws Exception {
        authenticate(1L);
        when(accessChecker.isActiveAdmin(1L)).thenReturn(true);
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/admin/users");
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(request, response, chain);

        verify(chain).doFilter(request, response);
    }

    @Test
    void alsoProtectsTheApiDocumentation() throws Exception {
        authenticate(1L);
        when(accessChecker.isActiveAdmin(1L)).thenReturn(false);
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(new MockHttpServletRequest("GET", "/v3/api-docs"), response, chain);

        assertThat(response.getStatus()).isEqualTo(401);
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
        verifyNoInteractions(accessChecker);
    }

    @Test
    void rejectsADisabledUserOnPersonalEndpoints() throws Exception {
        AuthenticatedUser principal = new AuthenticatedUser(3L, "user@overlab.gg", UserRole.USER);
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(principal, null,
                List.of(new SimpleGrantedAuthority("ROLE_USER"))));
        when(accessChecker.isActiveUser(3L)).thenReturn(false);
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(new MockHttpServletRequest("GET", "/api/me/favorites"), response, chain);

        assertThat(response.getStatus()).isEqualTo(401);
        verifyNoInteractions(chain);
    }

    @Test
    void rejectsAnAdminWhoIsNoLongerActive() throws Exception {
        authenticate(1L);
        when(accessChecker.isActiveAdmin(1L)).thenReturn(false);
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

    @Test
    void rejectsADisabledUserOnStateChangingRequestsOutsideThePersonalArea() throws Exception {
        AuthenticatedUser principal = new AuthenticatedUser(3L, "user@overlab.gg", UserRole.USER);
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(principal, null,
                List.of(new SimpleGrantedAuthority("ROLE_USER"))));
        when(accessChecker.isActiveUser(3L)).thenReturn(false);
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(new MockHttpServletRequest("POST", "/api/feedback"), response, chain);

        assertThat(response.getStatus()).isEqualTo(401);
        verifyNoInteractions(chain);
    }

    @Test
    void doesNotBlockLogoutOrRefreshForADisabledUser() throws Exception {
        AuthenticatedUser principal = new AuthenticatedUser(3L, "user@overlab.gg", UserRole.USER);
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(principal, null,
                List.of(new SimpleGrantedAuthority("ROLE_USER"))));
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/auth/logout");
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(request, response, chain);

        verify(chain).doFilter(request, response);
        verifyNoInteractions(accessChecker);
    }
}
