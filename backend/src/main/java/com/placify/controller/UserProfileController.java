package com.placify.controller;

import com.placify.entity.User;
import com.placify.repository.ApplicationRepository;
import com.placify.repository.DsaTrackerRepository;
import com.placify.repository.NoteRepository;
import com.placify.repository.StudyTaskRepository;
import com.placify.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/profile")
public class UserProfileController {

    private final UserRepository userRepository;
    private final ApplicationRepository applicationRepository;
    private final DsaTrackerRepository dsaTrackerRepository;
    private final StudyTaskRepository studyTaskRepository;
    private final NoteRepository noteRepository;

    public UserProfileController(UserRepository userRepository,
                                  ApplicationRepository applicationRepository,
                                  DsaTrackerRepository dsaTrackerRepository,
                                  StudyTaskRepository studyTaskRepository,
                                  NoteRepository noteRepository) {
        this.userRepository = userRepository;
        this.applicationRepository = applicationRepository;
        this.dsaTrackerRepository = dsaTrackerRepository;
        this.studyTaskRepository = studyTaskRepository;
        this.noteRepository = noteRepository;
    }

    /**
     * GET /api/profile
     * Returns the current user's profile with personal stats.
     */
    @GetMapping
    public ResponseEntity<?> getProfile(Authentication auth) {
        Long userId = (Long) auth.getCredentials();

        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            return ResponseEntity.notFound().build();
        }

        long appCount = applicationRepository.countByUserId(userId);
        long dsaCount = dsaTrackerRepository.countByUserId(userId);
        Double avgDsa = dsaTrackerRepository.findAverageProgressByUserId(userId);
        long taskCount = studyTaskRepository.countByUserId(userId);
        long noteCount = noteRepository.countByUserId(userId);

        Map<String, Object> stats = new HashMap<>();
        stats.put("applicationCount", appCount);
        stats.put("dsaTopicCount", dsaCount);
        stats.put("averageDsaProgress", avgDsa != null ? Math.round(avgDsa * 10.0) / 10.0 : 0.0);
        stats.put("taskCount", taskCount);
        stats.put("noteCount", noteCount);

        Map<String, Object> profile = new HashMap<>();
        profile.put("id", user.getId());
        profile.put("username", user.getUsername());
        profile.put("email", user.getEmail());
        profile.put("role", user.getRole().name());
        profile.put("createdAt", user.getCreatedAt() != null ? user.getCreatedAt().toString() : "");
        profile.put("apiKey", user.getApiKey());
        profile.put("stats", stats);

        return ResponseEntity.ok(profile);
    }

    /**
     * POST /api/profile/api-key/regenerate
     * Regenerates the API key for the current user.
     */
    @PostMapping("/api-key/regenerate")
    public ResponseEntity<?> regenerateApiKey(Authentication auth) {
        Long userId = (Long) auth.getCredentials();

        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            return ResponseEntity.notFound().build();
        }

        user.setApiKey(java.util.UUID.randomUUID().toString());
        userRepository.save(user);

        Map<String, String> response = new HashMap<>();
        response.put("apiKey", user.getApiKey());
        response.put("message", "API Key regenerated successfully");

        return ResponseEntity.ok(response);
    }
}
