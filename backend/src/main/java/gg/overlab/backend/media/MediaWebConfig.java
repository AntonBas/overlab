package gg.overlab.backend.media;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.util.concurrent.TimeUnit;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.CacheControl;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
@RequiredArgsConstructor
public class MediaWebConfig implements WebMvcConfigurer {

    private final MediaProperties properties;

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(new HandlerInterceptor() {
            @Override
            public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
                response.setHeader("X-Content-Type-Options", "nosniff");
                response.setHeader("Content-Security-Policy", "default-src 'none'; style-src 'unsafe-inline'; sandbox");
                return true;
            }
        }).addPathPatterns("/media/**");
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String location = properties.directory().toAbsolutePath().normalize().toUri().toString();
        registry.addResourceHandler("/media/**")
                .addResourceLocations(location.endsWith("/") ? location : location + "/")
                .setCacheControl(CacheControl.maxAge(7, TimeUnit.DAYS).cachePublic());
    }
}
