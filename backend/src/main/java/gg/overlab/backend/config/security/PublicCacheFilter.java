package gg.overlab.backend.config.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.http.HttpHeaders;
import org.springframework.web.filter.OncePerRequestFilter;

public class PublicCacheFilter extends OncePerRequestFilter {

    private static final String PUBLIC_CACHE_CONTROL = "public, max-age=60, stale-while-revalidate=300";

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return !PublicApiPaths.isPublicRead(request.getMethod(), request.getRequestURI());
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        response.setHeader(HttpHeaders.CACHE_CONTROL, PUBLIC_CACHE_CONTROL);
        filterChain.doFilter(request, response);
    }
}
