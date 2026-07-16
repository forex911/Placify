package com.placify.controller;

import com.placify.dto.SubjectProgressDTO;
import com.placify.entity.SubjectProgress.Subject;
import com.placify.service.SubjectProgressService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/subjects")
public class SubjectProgressController {

    private final SubjectProgressService subjectProgressService;

    public SubjectProgressController(SubjectProgressService subjectProgressService) {
        this.subjectProgressService = subjectProgressService;
    }

    @GetMapping
    public ResponseEntity<List<SubjectProgressDTO>> getAllSubjects(Authentication auth) {
        Long userId = (Long) auth.getCredentials();
        return ResponseEntity.ok(subjectProgressService.getAllForUser(userId));
    }

    @PutMapping("/{subject}")
    public ResponseEntity<SubjectProgressDTO> updateSubject(@PathVariable Subject subject,
                                                             @RequestBody SubjectProgressDTO dto,
                                                             Authentication auth) {
        Long userId = (Long) auth.getCredentials();
        return ResponseEntity.ok(subjectProgressService.upsertSubject(userId, subject, dto));
    }

    @GetMapping("/admin/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<SubjectProgressDTO>> getAllForAdmin() {
        return ResponseEntity.ok(subjectProgressService.getAllForAdmin());
    }
}
