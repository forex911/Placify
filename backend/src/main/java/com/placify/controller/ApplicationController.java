package com.placify.controller;

import com.placify.dto.ApplicationDTO;
import com.placify.service.ApplicationService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/applications")
public class ApplicationController {

    private final ApplicationService applicationService;

    public ApplicationController(ApplicationService applicationService) {
        this.applicationService = applicationService;
    }

    /** Extract userId from the JWT â€” stored as credentials in the auth token */
    private Long getUserId(Authentication auth) {
        return (Long) auth.getCredentials();
    }

    @GetMapping
    public ResponseEntity<List<ApplicationDTO>> getAllApplications(
            @RequestParam(required = false) String status,
            Authentication auth) {
        return ResponseEntity.ok(applicationService.getAllApplications(getUserId(auth), status));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApplicationDTO> getApplicationById(
            @PathVariable Long id,
            Authentication auth) {
        return ResponseEntity.ok(applicationService.getApplicationById(id, getUserId(auth)));
    }

    @PostMapping
    public ResponseEntity<ApplicationDTO> createApplication(
            @Valid @RequestBody ApplicationDTO dto,
            Authentication auth) {
        ApplicationDTO created = applicationService.createApplication(dto, getUserId(auth));
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApplicationDTO> updateApplication(
            @PathVariable Long id,
            @Valid @RequestBody ApplicationDTO dto,
            Authentication auth) {
        return ResponseEntity.ok(applicationService.updateApplication(id, dto, getUserId(auth)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteApplication(
            @PathVariable Long id,
            Authentication auth) {
        applicationService.deleteApplication(id, getUserId(auth));
        return ResponseEntity.noContent().build();
    }
}
