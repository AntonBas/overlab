package gg.overlab.backend.config.security;

import static org.assertj.core.api.Assertions.assertThat;

import jakarta.servlet.FilterChain;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

class PublicEtagConfigTest {

    private final jakarta.servlet.Filter filter = new PublicEtagConfig().publicEtagFilter().getFilter();

    @Test
    void publicReadsGetAnEtagAndAnswerNotModifiedForTheSameBody() throws Exception {
        MockHttpServletResponse first = run(new MockHttpServletRequest("GET", "/api/heroes"));
        String etag = first.getHeader(HttpHeaders.ETAG);
        assertThat(etag).isNotBlank();

        MockHttpServletRequest conditional = new MockHttpServletRequest("GET", "/api/heroes");
        conditional.addHeader(HttpHeaders.IF_NONE_MATCH, etag);
        assertThat(run(conditional).getStatus()).isEqualTo(304);
    }

    @Test
    void nonPublicRequestsAreNotGivenAnEtag() throws Exception {
        assertThat(run(new MockHttpServletRequest("GET", "/api/me/favorites")).getHeader(HttpHeaders.ETAG)).isNull();
        assertThat(run(new MockHttpServletRequest("POST", "/api/feedback")).getHeader(HttpHeaders.ETAG)).isNull();
    }

    private MockHttpServletResponse run(MockHttpServletRequest request) throws Exception {
        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = (servletRequest, servletResponse) -> {
            HttpServletResponse httpResponse = (HttpServletResponse) servletResponse;
            httpResponse.setContentType("application/json");
            httpResponse.getWriter().write("[{\"slug\":\"ana\"}]");
        };
        filter.doFilter(request, response, chain);
        return response;
    }
}
