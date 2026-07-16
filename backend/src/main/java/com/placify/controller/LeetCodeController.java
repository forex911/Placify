package com.placify.controller;

import com.placify.dto.LeetCodeProfileDTO;
import com.placify.service.LeetCodeProfileService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.Map;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

@RestController
@RequestMapping("/api/leetcode")
public class LeetCodeController {

    private final LeetCodeProfileService leetCodeProfileService;
    private final HttpClient httpClient = HttpClient.newHttpClient();
    private final ObjectMapper objectMapper = new ObjectMapper();

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

    @GetMapping("/fetch/{username}")
    public ResponseEntity<?> fetchFromLeetCode(@PathVariable String username) {
        try {
            String query = "{\"query\":\"query userProfile($username: String!) { matchedUser(username: $username) { username profile { ranking } submitStatsGlobal { acSubmissionNum { difficulty count } } } }\",\"variables\":{\"username\":\"" + username + "\"}}";

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://leetcode.com/graphql"))
                    .header("Content-Type", "application/json")
                    .header("Referer", "https://leetcode.com")
                    .POST(HttpRequest.BodyPublishers.ofString(query))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            JsonNode root = objectMapper.readTree(response.body());
            JsonNode user = root.path("data").path("matchedUser");

            if (user.isMissingNode() || user.isNull()) {
                return ResponseEntity.ok(Map.of("error", true, "message", "User not found"));
            }

            int ranking = user.path("profile").path("ranking").asInt(0);
            JsonNode submissions = user.path("submitStatsGlobal").path("acSubmissionNum");

            int totalSolved = 0, easySolved = 0, mediumSolved = 0, hardSolved = 0;
            for (JsonNode sub : submissions) {
                String difficulty = sub.path("difficulty").asText();
                int count = sub.path("count").asInt(0);
                switch (difficulty) {
                    case "All" -> totalSolved = count;
                    case "Easy" -> easySolved = count;
                    case "Medium" -> mediumSolved = count;
                    case "Hard" -> hardSolved = count;
                }
            }

            return ResponseEntity.ok(Map.of(
                    "username", username,
                    "totalSolved", totalSolved,
                    "easySolved", easySolved,
                    "mediumSolved", mediumSolved,
                    "hardSolved", hardSolved,
                    "ranking", ranking
            ));
        } catch (Exception e) {
            return ResponseEntity.ok(Map.of("error", true, "message", "Failed to fetch: " + e.getMessage()));
        }
    }

    @GetMapping("/fetch/{username}/skills")
    public ResponseEntity<?> fetchSkillsFromLeetCode(@PathVariable String username) {
        try {
            String query = "{\"query\":\"query skillStats($username: String!) { matchedUser(username: $username) { tagProblemCounts { advanced { tagName problemsSolved } intermediate { tagName problemsSolved } fundamental { tagName problemsSolved } } } }\",\"variables\":{\"username\":\"" + username + "\"}}";

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://leetcode.com/graphql"))
                    .header("Content-Type", "application/json")
                    .header("Referer", "https://leetcode.com")
                    .POST(HttpRequest.BodyPublishers.ofString(query))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            JsonNode root = objectMapper.readTree(response.body());
            JsonNode user = root.path("data").path("matchedUser");

            if (user.isMissingNode() || user.isNull()) {
                return ResponseEntity.ok(Map.of("error", true, "message", "User not found"));
            }

            JsonNode tagCounts = user.path("tagProblemCounts");
            java.util.Map<String, Integer> topicMap = new java.util.HashMap<>();

            for (String level : new String[]{"fundamental", "intermediate", "advanced"}) {
                for (JsonNode tag : tagCounts.path(level)) {
                    String tagName = tag.path("tagName").asText();
                    int solved = tag.path("problemsSolved").asInt(0);
                    topicMap.merge(tagName, solved, Integer::max);
                }
            }

            // Convert to a list of {tagName, problemsSolved}
            var result = topicMap.entrySet().stream()
                    .map(e -> Map.of("tagName", e.getKey(), "problemsSolved", e.getValue()))
                    .toList();

            return ResponseEntity.ok(Map.of("skills", result));
        } catch (Exception e) {
            return ResponseEntity.ok(Map.of("error", true, "message", "Failed to fetch skills: " + e.getMessage()));
        }
    }
}
