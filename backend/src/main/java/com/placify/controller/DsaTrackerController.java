package com.placify.controller;

import com.placify.dto.DsaTrackerDTO;
import com.placify.service.DsaTrackerService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/dsa")
public class DsaTrackerController {

    private final DsaTrackerService dsaTrackerService;

    public DsaTrackerController(DsaTrackerService dsaTrackerService) {
        this.dsaTrackerService = dsaTrackerService;
    }

    @GetMapping
    public ResponseEntity<List<DsaTrackerDTO>> getAllTopics(Authentication auth) {
        Long userId = (Long) auth.getCredentials();
        return ResponseEntity.ok(dsaTrackerService.getAllTopics(userId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<DsaTrackerDTO> getTopicById(@PathVariable Long id, Authentication auth) {
        Long userId = (Long) auth.getCredentials();
        return ResponseEntity.ok(dsaTrackerService.getTopicById(id, userId));
    }

    @PostMapping
    public ResponseEntity<DsaTrackerDTO> createTopic(@RequestBody DsaTrackerDTO dto, Authentication auth) {
        Long userId = (Long) auth.getCredentials();
        return ResponseEntity.ok(dsaTrackerService.createTopic(dto, userId));
    }

    @PutMapping("/{id}")
    public ResponseEntity<DsaTrackerDTO> updateTopic(@PathVariable Long id,
                                                       @RequestBody DsaTrackerDTO dto,
                                                       Authentication auth) {
        Long userId = (Long) auth.getCredentials();
        return ResponseEntity.ok(dsaTrackerService.updateTopic(id, dto, userId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteTopic(@PathVariable Long id, Authentication auth) {
        Long userId = (Long) auth.getCredentials();
        dsaTrackerService.deleteTopic(id, userId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getDsaStats(Authentication auth) {
        Long userId = (Long) auth.getCredentials();
        double avg = dsaTrackerService.getAverageProgressByUser(userId);
        long totalSolved = dsaTrackerService.getTotalSolvedByUser(userId);
        long completedTopics = dsaTrackerService.getCompletedTopicsCountByUser(userId);
        return ResponseEntity.ok(Map.of(
            "averageProgress", avg,
            "totalQuestionsSolved", totalSolved,
            "completedTopics", completedTopics
        ));
    }
}
