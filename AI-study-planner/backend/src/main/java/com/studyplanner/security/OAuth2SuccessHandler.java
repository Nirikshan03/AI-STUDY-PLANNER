package com.studyplanner.security;
import com.studyplanner.model.User;
import com.studyplanner.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Component
@RequiredArgsConstructor
@Slf4j
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {
    private final UserRepository userRepository;
    private final JwtService jwtService;

    @Value("${app.frontend.url:http://localhost:3000}")
    private String frontendUrl;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws IOException {
        OAuth2User oauthUser = (OAuth2User) authentication.getPrincipal();
        String email = oauthUser.getAttribute("email");
        String name  = oauthUser.getAttribute("name");

        // Find or create user
        User user = userRepository.findByEmail(email).orElseGet(() -> {
            User newUser = User.builder()
                .email(email).name(name)
                .provider("GOOGLE")
                .password(null)
                .build();
            return userRepository.save(newUser);
        });

        String token = jwtService.generateToken(email);
        String encodedName  = URLEncoder.encode(user.getName(),  StandardCharsets.UTF_8);
        String encodedEmail = URLEncoder.encode(user.getEmail(), StandardCharsets.UTF_8);

        // Redirect to frontend with token + user info as query params
        String redirectUrl = String.format(
            "%s/oauth2/callback?token=%s&userId=%d&name=%s&email=%s&provider=GOOGLE",
            frontendUrl, token, user.getId(), encodedName, encodedEmail
        );
        log.info("OAuth2 login success for: {}", email);
        getRedirectStrategy().sendRedirect(request, response, redirectUrl);
    }
}