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

import com.placify.config.SanitizationUtil;
import java.time.LocalDate;
import java.util.Optional;

import com.placify.dto.HackathonDTO;
import com.placify.dto.ExtensionHackathonRequest;
import com.placify.entity.Hackathon.HackathonStatus;
import com.placify.service.HackathonService;

@RestController
@RequestMapping("/api/extension")
public class ExtensionController {

    private final UserRepository userRepository;
    private final ApplicationService applicationService;
    private final HackathonService hackathonService;

    public ExtensionController(UserRepository userRepository, ApplicationService applicationService, HackathonService hackathonService) {
        this.userRepository = userRepository;
        this.applicationService = applicationService;
        this.hackathonService = hackathonService;
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
        applicationDTO.setCompanyName(SanitizationUtil.stripHtml(request.getCompanyName()));
        applicationDTO.setRole(SanitizationUtil.stripHtml(request.getRole()));
        applicationDTO.setLocation(SanitizationUtil.stripHtml(request.getLocation()));
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

    /**
     * POST /api/extension/hackathons
     * Saves a hackathon quickly via browser extension, using X-API-KEY header.
     */
    @PostMapping("/hackathons")
    public ResponseEntity<?> saveHackathon(
            @RequestHeader(value = "X-API-KEY", required = false) String apiKey,
            @Valid @RequestBody ExtensionHackathonRequest request) {

        if (apiKey == null || apiKey.trim().isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("API Key is required");
        }

        Optional<User> userOpt = userRepository.findByApiKey(apiKey);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid API Key");
        }
        User user = userOpt.get();

        HackathonDTO hackathonDTO = new HackathonDTO();
        hackathonDTO.setHackathonName(SanitizationUtil.stripHtml(request.getHackathonName()));
        hackathonDTO.setProjectTitle(SanitizationUtil.stripHtml(request.getProjectTitle()));
        hackathonDTO.setProjectLink(request.getProjectLink());
        
        // Auto-fill required fields for fast saving
        hackathonDTO.setDate(LocalDate.now());
        hackathonDTO.setStatus(HackathonStatus.Registered);
        hackathonDTO.setTeamSize(1); // Default team size

        try {
            HackathonDTO created = hackathonService.create(user.getId(), hackathonDTO);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error saving hackathon: " + e.getMessage());
        }
    }
}
