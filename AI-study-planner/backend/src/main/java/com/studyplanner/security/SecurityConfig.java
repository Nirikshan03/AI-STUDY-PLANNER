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

    // Uses Java serialization (NOT Jackson) because OAuth2AuthorizationRequest
    // has no default constructor — Jackson silently returns null on deserialize,
    // causing "authorization_request_not_found".
    public static class CookieAuthorizationRequestRepository
            implements AuthorizationRequestRepository<OAuth2AuthorizationRequest> {

        private static final String COOKIE_NAME = "oauth2_auth_request";
        private static final int COOKIE_MAX_AGE = 180;

        @Override
        public OAuth2AuthorizationRequest loadAuthorizationRequest(HttpServletRequest request) {
            return getCookieValue(request).flatMap(this::deserialize).orElse(null);
        }

        @Override
        public void saveAuthorizationRequest(OAuth2AuthorizationRequest authorizationRequest,
                                             HttpServletRequest request,
                                             HttpServletResponse response) {
            if (authorizationRequest == null) { deleteCookie(request, response); return; }
            try {
                Cookie cookie = new Cookie(COOKIE_NAME, serialize(authorizationRequest));
                cookie.setPath("/");
                cookie.setHttpOnly(true);
                cookie.setMaxAge(COOKIE_MAX_AGE);
                cookie.setSecure(true);
                response.addCookie(cookie);
            } catch (Exception e) {
                throw new RuntimeException("Failed to save OAuth2 cookie", e);
            }
        }

        @Override
        public OAuth2AuthorizationRequest removeAuthorizationRequest(HttpServletRequest request,
                                                                      HttpServletResponse response) {
            OAuth2AuthorizationRequest req = loadAuthorizationRequest(request);
            if (req != null) deleteCookie(request, response);
            return req;
        }

        private String serialize(OAuth2AuthorizationRequest request) throws IOException {
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            try (ObjectOutputStream oos = new ObjectOutputStream(baos)) { oos.writeObject(request); }
            return Base64.getUrlEncoder().encodeToString(baos.toByteArray());
        }

        private java.util.Optional<OAuth2AuthorizationRequest> deserialize(String value) {
            try {
                byte[] bytes = Base64.getUrlDecoder().decode(value);
                try (ObjectInputStream ois = new ObjectInputStream(new ByteArrayInputStream(bytes))) {
                    return java.util.Optional.of((OAuth2AuthorizationRequest) ois.readObject());
                }
            } catch (Exception e) { return java.util.Optional.empty(); }
        }

        private java.util.Optional<String> getCookieValue(HttpServletRequest request) {
            Cookie[] cookies = request.getCookies();
            if (cookies == null) return java.util.Optional.empty();
            return Arrays.stream(cookies).filter(c -> COOKIE_NAME.equals(c.getName()))
                    .map(Cookie::getValue).findFirst();
        }

        private void deleteCookie(HttpServletRequest request, HttpServletResponse response) {
            Cookie[] cookies = request.getCookies();
            if (cookies == null) return;
            Arrays.stream(cookies).filter(c -> COOKIE_NAME.equals(c.getName())).forEach(c -> {
                c.setValue(""); c.setPath("/"); c.setMaxAge(0); response.addCookie(c);
            });
        }
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/**","/oauth2/**","/login/oauth2/**",
                    "/swagger-ui/**","/v3/api-docs/**","/actuator/**").permitAll()
                .anyRequest().authenticated()
            )
            .oauth2Login(oauth -> oauth
                .authorizationEndpoint(ep -> ep
                    .authorizationRequestRepository(new CookieAuthorizationRequestRepository()))
                .successHandler(oAuth2SuccessHandler)
            )
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOriginPatterns(List.of("*"));
        config.setAllowedMethods(List.of("GET","POST","PUT","DELETE","OPTIONS"));
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

    @Bean public PasswordEncoder passwordEncoder() { return new BCryptPasswordEncoder(); }

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