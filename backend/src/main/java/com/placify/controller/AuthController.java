package com.placify.controller;

import com.placify.dto.AuthDTO.AuthResponse;
import com.placify.dto.AuthDTO.LoginRequest;
import com.placify.dto.AuthDTO.RegisterRequest;
import com.placify.service.AuthService;
import com.placify.config.SanitizationUtil;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    @Value("${jwt.expiration-ms}")
    private long expirationMs;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request, HttpServletResponse httpResponse) {
        try {
            // Sanitize username
            request.setUsername(SanitizationUtil.stripHtml(request.getUsername()));

            AuthResponse response = authService.register(request);
            addJwtCookie(httpResponse, response.getToken());

            // Return user data WITHOUT the token in the body
            return ResponseEntity.ok(Map.of(
                "userId", response.getUserId(),
                "username", response.getUsername(),
                "email", response.getEmail(),
                "role", response.getRole()
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request, HttpServletResponse httpResponse) {
        try {
            AuthResponse response = authService.login(request);
            addJwtCookie(httpResponse, response.getToken());

            // Return user data WITHOUT the token in the body
            return ResponseEntity.ok(Map.of(
                "userId", response.getUserId(),
                "username", response.getUsername(),
                "email", response.getEmail(),
                "role", response.getRole()
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.status(401).body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletResponse httpResponse) {
        // Clear the cookie by setting max-age to 0
        Cookie cookie = new Cookie("placify_token", "");
        cookie.setHttpOnly(true);
        cookie.setSecure(true);
        cookie.setPath("/api");
        cookie.setMaxAge(0);
        cookie.setAttribute("SameSite", "None");
        httpResponse.addCookie(cookie);
        return ResponseEntity.ok(Map.of("message", "Logged out successfully"));
    }

    private void addJwtCookie(HttpServletResponse httpResponse, String token) {
        Cookie cookie = new Cookie("placify_token", token);
        cookie.setHttpOnly(true);
        cookie.setSecure(true);
        cookie.setPath("/api");
        cookie.setMaxAge((int) (expirationMs / 1000)); // Convert ms to seconds
        cookie.setAttribute("SameSite", "None");
        httpResponse.addCookie(cookie);
    }
}
