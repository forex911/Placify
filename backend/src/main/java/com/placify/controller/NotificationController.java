package com.placify.controller;

import com.placify.dto.NotificationDTO;
import com.placify.service.NotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    public ResponseEntity<List<NotificationDTO>> getUnread(Authentication auth) {
        Long userId = (Long) auth.getCredentials();
        return ResponseEntity.ok(notificationService.getUnreadForUser(userId));
    }

    @GetMapping("/count")
    public ResponseEntity<Map<String, Long>> getUnreadCount(Authentication auth) {
        Long userId = (Long) auth.getCredentials();
        return ResponseEntity.ok(Map.of("count", notificationService.getUnreadCount(userId)));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<?> markAsRead(@PathVariable Long id, Authentication auth) {
        Long userId = (Long) auth.getCredentials();
        notificationService.markAsRead(id, userId);
        return ResponseEntity.ok(Map.of("success", true));
    }

    @PutMapping("/read-all")
    public ResponseEntity<?> markAllAsRead(Authentication auth) {
        Long userId = (Long) auth.getCredentials();
        notificationService.markAllAsRead(userId);
        return ResponseEntity.ok(Map.of("success", true));
    }

    @PostMapping("/generate")
    public ResponseEntity<Map<String, Integer>> generateNotifications(Authentication auth) {
        Long userId = (Long) auth.getCredentials();
        int count = notificationService.generateNotifications(userId);
        return ResponseEntity.ok(Map.of("generated", count));
    }
}
