package com.studyplanner.service;
import com.studyplanner.dto.*;
import com.studyplanner.model.User;
import com.studyplanner.repository.UserRepository;
import com.studyplanner.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {
    private final UserRepository userRepo;
    private final PasswordEncoder encoder;
    private final JwtService jwtService;
    private final AuthenticationManager authManager;

    public AuthResponse register(RegisterRequest req) {
        if (userRepo.existsByEmail(req.getEmail()))
            throw new RuntimeException("Email already registered");
        User user = User.builder()
            .name(req.getName()).email(req.getEmail())
            .password(encoder.encode(req.getPassword()))
            .examDate(req.getExamDate())
            .dailyStudyHours(req.getDailyStudyHours() != null ? req.getDailyStudyHours() : 4)
            .build();
        userRepo.save(user);
        String token = jwtService.generateToken(user.getEmail());
        return new AuthResponse(token, user.getId(), user.getName(), user.getEmail(),
            user.getExamDate(), user.getDailyStudyHours(), user.getStreak(), user.getProvider());
    }

    public AuthResponse login(AuthRequest req) {
        authManager.authenticate(new UsernamePasswordAuthenticationToken(req.getEmail(), req.getPassword()));
        User user = userRepo.findByEmail(req.getEmail()).orElseThrow();
        String token = jwtService.generateToken(user.getEmail());
        return new AuthResponse(token, user.getId(), user.getName(), user.getEmail(),
            user.getExamDate(), user.getDailyStudyHours(), user.getStreak(), user.getProvider());
    }

    public boolean validateToken(String token) { return jwtService.isValid(token); }
}