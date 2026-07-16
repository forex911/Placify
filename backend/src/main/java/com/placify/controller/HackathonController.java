package com.placify.controller;

import com.placify.dto.HackathonDTO;
import com.placify.service.HackathonService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import com.placify.entity.User;
import com.placify.repository.UserRepository;

import java.util.List;

@RestController
@RequestMapping("/api/hackathons")
public class HackathonController {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(HackathonController.class);

    private final HackathonService hackathonService;
    private final UserRepository userRepository;

    public HackathonController(HackathonService hackathonService, UserRepository userRepository) {
        this.hackathonService = hackathonService;
        this.userRepository = userRepository;
    }

    private Long getUserId(Authentication auth) {
        return (Long) auth.getCredentials();
    }

    @GetMapping
    public ResponseEntity<List<HackathonDTO>> getAllForUser(Authentication auth) {
        try {
            log.info("GET /api/hackathons called by user: {}", auth.getName());
            Long userId = getUserId(auth);
            log.info("Resolved userId: {}", userId);
            List<HackathonDTO> result = hackathonService.getAllForUser(userId);
            log.info("Returning {} hackathons", result.size());
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("ERROR in GET /api/hackathons", e);
            throw e;
        }
    }

    @PostMapping
    public ResponseEntity<HackathonDTO> create(Authentication auth,
                                              @RequestBody HackathonDTO dto) {
        return ResponseEntity.ok(hackathonService.create(getUserId(auth), dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<HackathonDTO> update(@PathVariable Long id,
                                              Authentication auth,
                                              @RequestBody HackathonDTO dto) {
        return ResponseEntity.ok(hackathonService.update(id, getUserId(auth), dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id,
                                      Authentication auth) {
        hackathonService.delete(id, getUserId(auth));
        return ResponseEntity.ok().build();
    }
}
