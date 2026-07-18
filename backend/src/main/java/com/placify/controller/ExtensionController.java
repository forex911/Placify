package com.placify.controller;

import com.placify.dto.ApplicationDTO;
import com.placify.dto.ExtensionApplicationRequest;
import com.placify.entity.Application.ApplicationStatus;
import com.placify.entity.User;
import com.placify.repository.UserRepository;
import com.placify.service.ApplicationService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Optional;

@RestController
@RequestMapping("/api/extension")
public class ExtensionController {

    private final UserRepository userRepository;
    private final ApplicationService applicationService;

    public ExtensionController(UserRepository userRepository, ApplicationService applicationService) {
        this.userRepository = userRepository;
        this.applicationService = applicationService;
    }

    /**
     * POST /api/extension/applications
     * Saves an application quickly via browser extension, using X-API-KEY header.
     */
    @PostMapping("/applications")
    public ResponseEntity<?> saveApplication(
            @RequestHeader(value = "X-API-KEY", required = false) String apiKey,
            @Valid @RequestBody ExtensionApplicationRequest request) {

        if (apiKey == null || apiKey.trim().isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("API Key is required");
        }

        Optional<User> userOpt = userRepository.findByApiKey(apiKey);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid API Key");
        }
        User user = userOpt.get();

        ApplicationDTO applicationDTO = new ApplicationDTO();
        applicationDTO.setCompanyName(request.getCompanyName());
        applicationDTO.setRole(request.getRole());
        applicationDTO.setLocation(request.getLocation());
        applicationDTO.setCompanyLink(request.getCompanyLink());
        
        // Auto-fill required fields for fast saving
        applicationDTO.setAppliedDate(LocalDate.now());
        applicationDTO.setStatus(ApplicationStatus.Applied);

        try {
            ApplicationDTO created = applicationService.createApplication(applicationDTO, user.getId());
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error saving application: " + e.getMessage());
        }
    }
}
