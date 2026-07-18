package com.placify.filter;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Rate limiting filter using Bucket4j.
 * Limits requests per IP address:
 *   - /api/auth/** → 10 requests per minute
 *   - /api/extension/** → 30 requests per minute
 */
@Component
public class RateLimitFilter extends OncePerRequestFilter {

    // Per-IP buckets for auth endpoints
    private final Map<String, Bucket> authBuckets = new ConcurrentHashMap<>();
    // Per-IP buckets for extension endpoints
    private final Map<String, Bucket> extensionBuckets = new ConcurrentHashMap<>();

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        String path = request.getRequestURI();
        String clientIp = getClientIp(request);

        if (path.startsWith("/api/auth/")) {
            Bucket bucket = authBuckets.computeIfAbsent(clientIp, k -> createAuthBucket());
            if (!bucket.tryConsume(1)) {
                response.setStatus(429);
                response.setContentType("application/json");
                response.getWriter().write("{\"message\":\"Too many requests. Please try again later.\"}");
                return;
            }
        } else if (path.startsWith("/api/extension/")) {
            Bucket bucket = extensionBuckets.computeIfAbsent(clientIp, k -> createExtensionBucket());
            if (!bucket.tryConsume(1)) {
                response.setStatus(429);
                response.setContentType("application/json");
                response.getWriter().write("{\"message\":\"Too many requests. Please try again later.\"}");
                return;
            }
        }

        filterChain.doFilter(request, response);
    }

    private Bucket createAuthBucket() {
        // 10 requests per minute for auth endpoints
        return Bucket.builder()
                .addLimit(Bandwidth.simple(10, Duration.ofMinutes(1)))
                .build();
    }

    private Bucket createExtensionBucket() {
        // 30 requests per minute for extension endpoints
        return Bucket.builder()
                .addLimit(Bandwidth.simple(30, Duration.ofMinutes(1)))
                .build();
    }

    private String getClientIp(HttpServletRequest request) {
        // Check for proxy headers (Render, Cloudflare, etc.)
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty()) {
            return xRealIp;
        }
        return request.getRemoteAddr();
    }
}
