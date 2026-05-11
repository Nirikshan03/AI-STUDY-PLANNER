package com.studyplanner.security;

import com.studyplanner.repository.UserRepository;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.*;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.client.web.AuthorizationRequestRepository;
import org.springframework.security.oauth2.core.endpoint.OAuth2AuthorizationRequest;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.io.*;
import java.util.Arrays;
import java.util.Base64;
import java.util.List;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtFilter jwtFilter;
    private final UserRepository userRepository;
    private final OAuth2SuccessHandler oAuth2SuccessHandler;

    // ── Cookie-based OAuth2 authorization request repository ──────────────────
    // Uses Java serialization (not Jackson) because OAuth2AuthorizationRequest
    // has no Jackson-compatible constructor and cannot be round-tripped with JSON.
    // The cookie survives Render free-tier spin-downs between the two redirect hops.
    public static class CookieAuthorizationRequestRepository
            implements AuthorizationRequestRepository<OAuth2AuthorizationRequest> {

        private static final String COOKIE_NAME  = "oauth2_auth_req";
        private static final int    COOKIE_MAX_AGE = 180; // 3 minutes

        @Override
        public OAuth2AuthorizationRequest loadAuthorizationRequest(HttpServletRequest request) {
            return readCookie(request);
        }

        @Override
        public void saveAuthorizationRequest(OAuth2AuthorizationRequest authRequest,
                                             HttpServletRequest request,
                                             HttpServletResponse response) {
            if (authRequest == null) {
                clearCookie(response);
                return;
            }
            try {
                ByteArrayOutputStream bos = new ByteArrayOutputStream();
                try (ObjectOutputStream oos = new ObjectOutputStream(bos)) {
                    oos.writeObject(authRequest);
                }
                String value = Base64.getUrlEncoder().encodeToString(bos.toByteArray());
                Cookie cookie = new Cookie(COOKIE_NAME, value);
                cookie.setPath("/");
                cookie.setHttpOnly(true);
                cookie.setSecure(true);   // HTTPS only on Render
                cookie.setMaxAge(COOKIE_MAX_AGE);
                response.addCookie(cookie);
            } catch (IOException e) {
                throw new RuntimeException("Failed to serialize OAuth2AuthorizationRequest", e);
            }
        }

        @Override
        public OAuth2AuthorizationRequest removeAuthorizationRequest(HttpServletRequest request,
                                                                      HttpServletResponse response) {
            OAuth2AuthorizationRequest req = readCookie(request);
            if (req != null) clearCookie(response);
            return req;
        }

        private OAuth2AuthorizationRequest readCookie(HttpServletRequest request) {
            if (request.getCookies() == null) return null;
            return Arrays.stream(request.getCookies())
                    .filter(c -> COOKIE_NAME.equals(c.getName()))
                    .findFirst()
                    .map(c -> {
                        try {
                            byte[] bytes = Base64.getUrlDecoder().decode(c.getValue());
                            try (ObjectInputStream ois = new ObjectInputStream(
                                    new ByteArrayInputStream(bytes))) {
                                return (OAuth2AuthorizationRequest) ois.readObject();
                            }
                        } catch (Exception e) {
                            return null;
                        }
                    })
                    .orElse(null);
        }

        private void clearCookie(HttpServletResponse response) {
            Cookie cookie = new Cookie(COOKIE_NAME, "");
            cookie.setPath("/");
            cookie.setMaxAge(0);
            response.addCookie(cookie);
        }
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(
                    "/api/auth/**",
                    "/oauth2/**",
                    "/login/oauth2/**",
                    "/swagger-ui/**",
                    "/v3/api-docs/**",
                    "/actuator/**"
                ).permitAll()
                .anyRequest().authenticated()
            )
            .oauth2Login(oauth -> oauth
                .authorizationEndpoint(ep -> ep
                    .authorizationRequestRepository(new CookieAuthorizationRequestRepository())
                )
                .successHandler(oAuth2SuccessHandler)
            )
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOriginPatterns(List.of("*"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    @Bean
    public UserDetailsService userDetailsService() {
        return email -> userRepository.findByEmail(email)
            .map(u -> User.withUsername(u.getEmail())
                .password(u.getPassword() != null ? u.getPassword() : "")
                .roles(u.getRole().name()).build())
            .orElseThrow(() -> new UsernameNotFoundException("User not found: " + email));
    }

    @Bean
    public PasswordEncoder passwordEncoder() { return new BCryptPasswordEncoder(); }

    @Bean
    public AuthenticationProvider authProvider() {
        DaoAuthenticationProvider p = new DaoAuthenticationProvider();
        p.setUserDetailsService(userDetailsService());
        p.setPasswordEncoder(passwordEncoder());
        return p;
    }

    @Bean
    public AuthenticationManager authManager(AuthenticationConfiguration cfg) throws Exception {
        return cfg.getAuthenticationManager();
    }
}