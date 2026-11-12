package gg.overlab.backend.config;

import static org.assertj.core.api.Assertions.assertThat;

import jakarta.servlet.FilterChain;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.jupiter.api.Test;
import org.slf4j.MDC;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

class RequestIdFilterTest {

    private final RequestIdFilter filter = new RequestIdFilter();
    private final MockHttpServletResponse response = new MockHttpServletResponse();

    private String idSeenByTheChain(MockHttpServletRequest request) throws Exception {
        AtomicReference<String> seen = new AtomicReference<>();
        FilterChain chain = (servletRequest, servletResponse) -> seen.set(MDC.get(RequestIdFilter.MDC_KEY));
        filter.doFilter(request, response, chain);
        return seen.get();
    }

    @Test
    void keepsAValidIncomingRequestId() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader(RequestIdFilter.HEADER, "abc-123");

        assertThat(idSeenByTheChain(request)).isEqualTo("abc-123");
        assertThat(response.getHeader(RequestIdFilter.HEADER)).isEqualTo("abc-123");
    }

    @Test
    void replacesAMissingOrUnsafeRequestId() throws Exception {
        MockHttpServletRequest unsafe = new MockHttpServletRequest();
        unsafe.addHeader(RequestIdFilter.HEADER, "bad id\r\nSet-Cookie: x=1");

        String generated = idSeenByTheChain(unsafe);

        assertThat(generated).matches("[0-9a-f-]{36}");
        assertThat(response.getHeader(RequestIdFilter.HEADER)).isEqualTo(generated);
        assertThat(idSeenByTheChain(new MockHttpServletRequest())).matches("[0-9a-f-]{36}");
    }

    @Test
    void clearsTheLoggingContextAfterTheRequest() throws Exception {
        idSeenByTheChain(new MockHttpServletRequest());

        assertThat(MDC.get(RequestIdFilter.MDC_KEY)).isNull();
    }
}
