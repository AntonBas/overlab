package gg.overlab.backend.config.security;

import java.util.List;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
@EnableWebSecurity
public class WebSecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http,
                                                   JwtTokenProvider tokenProvider,
                                                   AuthCookieService cookieService,
                                                   StringRedisTemplate redisTemplate,
                                                   AuthProperties authProperties,
                                                   RateLimitProperties rateLimitProperties,
                                                   ObjectProvider<ClientRegistrationRepository> clientRegistrations,
                                                   ObjectProvider<OAuth2LoginHandlers> oauthHandlers) throws Exception {
        JwtAuthenticationFilter jwtFilter = new JwtAuthenticationFilter(tokenProvider, cookieService);
        RateLimitFilter rateLimitFilter = new RateLimitFilter(redisTemplate, authProperties, rateLimitProperties);

        http.cors(Customizer.withDefaults())
                .csrf(csrf -> csrf.disable())
                .exceptionHandling(handling -> handling
                        .authenticationEntryPoint(new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED))
                        .accessDeniedHandler((request, response, exception) ->
                                response.setStatus(HttpStatus.FORBIDDEN.value())))
                .authorizeHttpRequests(authorize -> authorize
                        .requestMatchers("/actuator/health/**", "/actuator/prometheus").permitAll()
                        .requestMatchers("/oauth2/**", "/login/oauth2/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/auth/me").authenticated()
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers("/api/admin/**", "/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html")
                        .hasRole("ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/**").permitAll()
                        .anyRequest().authenticated())
                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class)
                .addFilterBefore(rateLimitFilter, JwtAuthenticationFilter.class)
                .addFilterBefore(new PublicCacheFilter(), JwtAuthenticationFilter.class);

        if (clientRegistrations.getIfAvailable() != null && oauthHandlers.getIfAvailable() != null) {
            OAuth2LoginHandlers handlers = oauthHandlers.getObject();
            http.oauth2Login(oauth -> oauth
                    .successHandler(handlers.successHandler())
                    .failureHandler(handlers.failureHandler()));
        }
        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource(@Value("${app.frontend-url}") String frontendUrl) {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of(frontendUrl));
        configuration.setAllowedMethods(List.of("GET", "POST", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", configuration);
        return source;
    }
}
