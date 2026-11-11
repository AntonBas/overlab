package gg.overlab.backend.config.security;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.stream.Stream;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.springframework.http.HttpHeaders;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

class PublicCacheFilterTest {

    private final PublicCacheFilter filter = new PublicCacheFilter();

    static Stream<Arguments> publicReads() {
        return Stream.of(Arguments.of("GET", "/api/heroes"), Arguments.of("GET", "/api/stats"),
                Arguments.of("GET", "/api/maps"));
    }

    static Stream<Arguments> notPublic() {
        return Stream.of(Arguments.of("POST", "/api/feedback"), Arguments.of("GET", "/api/admin/users"),
                Arguments.of("GET", "/api/auth/me"), Arguments.of("GET", "/api/me/favorites"),
                Arguments.of("GET", "/media/maps/a.png"), Arguments.of("GET", "/actuator/health"));
    }

    @ParameterizedTest
    @MethodSource("publicReads")
    void publicReadsAreCacheableForAMinute(String method, String path) throws Exception {
        MockHttpServletResponse response = run(method, path);

        assertThat(response.getHeader(HttpHeaders.CACHE_CONTROL))
                .isEqualTo("public, max-age=60, stale-while-revalidate=300");
    }

    @ParameterizedTest
    @MethodSource("notPublic")
    void everythingElseIsLeftUntouched(String method, String path) throws Exception {
        assertThat(run(method, path).getHeader(HttpHeaders.CACHE_CONTROL)).isNull();
    }

    @Test
    void publicApiPathsExcludeAccountAndAdminAreas() {
        assertThat(PublicApiPaths.isPublicRead("GET", "/api/me")).isFalse();
        assertThat(PublicApiPaths.isPublicRead("GET", "/api/admin/x")).isFalse();
        assertThat(PublicApiPaths.isPublicRead("HEAD", "/api/heroes")).isFalse();
        assertThat(PublicApiPaths.isPublicRead("GET", "/api/heroes")).isTrue();
    }

    private MockHttpServletResponse run(String method, String path) throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest(method, path);
        MockHttpServletResponse response = new MockHttpServletResponse();
        filter.doFilter(request, response, new MockFilterChain());
        return response;
    }
}
