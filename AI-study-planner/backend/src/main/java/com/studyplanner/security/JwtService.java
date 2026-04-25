package com.studyplanner.security;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import javax.crypto.SecretKey;
import java.util.Date;

@Service
public class JwtService {
    @Value("${jwt.secret:studyplanner-super-secret-key-min-256-bits-long-for-hs256}")
    private String secretKey;
    @Value("${jwt.expiration:86400000}")
    private long expiration;

    private SecretKey getKey() { return Keys.hmacShaKeyFor(secretKey.getBytes()); }

    public String generateToken(String email) {
        return Jwts.builder().subject(email)
            .issuedAt(new Date())
            .expiration(new Date(System.currentTimeMillis() + expiration))
            .signWith(getKey()).compact();
    }
    public String extractEmail(String token) {
        return Jwts.parser().verifyWith(getKey()).build()
            .parseSignedClaims(token).getPayload().getSubject();
    }
    public boolean isValid(String token) {
        try { Jwts.parser().verifyWith(getKey()).build().parseSignedClaims(token); return true; }
        catch (Exception e) { return false; }
    }
}