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

import java.util.HashMap;
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

    private Map<String, Object> buildResponseMap(AuthResponse response) {
        Map<String, Object> map = new HashMap<>();
        map.put("token", response.getToken());
        map.put("userId", response.getUserId());
        map.put("username", response.getUsername());
        map.put("email", response.getEmail());
        map.put("role", response.getRole());
        map.put("profilePicture", response.getProfilePicture());
        map.put("setupCompleted", response.isSetupCompleted());
        return map;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request, HttpServletResponse httpResponse) {
        try {
            request.setUsername(SanitizationUtil.stripHtml(request.getUsername()));
            AuthResponse response = authService.register(request);
            addJwtCookie(httpResponse, response.getToken());
            return ResponseEntity.ok(buildResponseMap(response));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request, HttpServletResponse httpResponse) {
        try {
            AuthResponse response = authService.login(request);
            addJwtCookie(httpResponse, response.getToken());
            return ResponseEntity.ok(buildResponseMap(response));
        } catch (RuntimeException e) {
            return ResponseEntity.status(401).body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/google")
    public ResponseEntity<?> googleLogin(@RequestBody Map<String, String> request, HttpServletResponse httpResponse) {
        try {
            String credential = request.get("credential");
            if (credential == null || credential.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("message", "Missing Google credential"));
            }
            AuthResponse response = authService.googleLogin(credential);
            addJwtCookie(httpResponse, response.getToken());
            return ResponseEntity.ok(buildResponseMap(response));
        } catch (RuntimeException e) {
            return ResponseEntity.status(401).body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/complete-setup")
    public ResponseEntity<?> completeSetup(@RequestBody com.placify.dto.AuthDTO.CompleteSetupRequest request, org.springframework.security.core.Authentication auth, HttpServletResponse httpResponse) {
        try {
            Long userId = (Long) auth.getCredentials();
            request.setUsername(SanitizationUtil.stripHtml(request.getUsername()));
            AuthResponse response = authService.completeSetup(userId, request);
            addJwtCookie(httpResponse, response.getToken());
            return ResponseEntity.ok(buildResponseMap(response));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletResponse httpResponse) {
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
        cookie.setMaxAge((int) (expirationMs / 1000));
        cookie.setAttribute("SameSite", "None");
        httpResponse.addCookie(cookie);
    }
}
