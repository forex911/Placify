package com.placify.controller;

import com.placify.dto.LeetCodeProfileDTO;
import com.placify.service.LeetCodeProfileService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/leetcode")
public class LeetCodeController {

    private final LeetCodeProfileService leetCodeProfileService;

    public LeetCodeController(LeetCodeProfileService leetCodeProfileService) {
        this.leetCodeProfileService = leetCodeProfileService;
    }

    @GetMapping
    public ResponseEntity<?> getProfile(Authentication auth) {
        Long userId = (Long) auth.getCredentials();
        return leetCodeProfileService.getProfile(userId)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElse(ResponseEntity.ok(Map.of("exists", false)));
    }

    @PutMapping
    public ResponseEntity<LeetCodeProfileDTO> upsertProfile(@RequestBody LeetCodeProfileDTO dto,
                                                              Authentication auth) {
        Long userId = (Long) auth.getCredentials();
        return ResponseEntity.ok(leetCodeProfileService.upsertProfile(userId, dto));
    }
}
