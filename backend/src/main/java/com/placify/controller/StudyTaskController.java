package com.placify.controller;

import com.placify.dto.StudyTaskDTO;
import com.placify.service.StudyTaskService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tasks")
public class StudyTaskController {

    private final StudyTaskService studyTaskService;

    public StudyTaskController(StudyTaskService studyTaskService) {
        this.studyTaskService = studyTaskService;
    }

    private Long getUserId(Authentication auth) {
        return (Long) auth.getCredentials();
    }

    @GetMapping
    public ResponseEntity<List<StudyTaskDTO>> getAllTasks(Authentication auth) {
        return ResponseEntity.ok(studyTaskService.getAllTasks(getUserId(auth)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<StudyTaskDTO> getTaskById(
            @PathVariable Long id,
            Authentication auth) {
        return ResponseEntity.ok(studyTaskService.getTaskById(id, getUserId(auth)));
    }

    @PostMapping
    public ResponseEntity<StudyTaskDTO> createTask(
            @Valid @RequestBody StudyTaskDTO dto,
            Authentication auth) {
        StudyTaskDTO created = studyTaskService.createTask(dto, getUserId(auth));
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<StudyTaskDTO> updateTask(
            @PathVariable Long id,
            @Valid @RequestBody StudyTaskDTO dto,
            Authentication auth) {
        return ResponseEntity.ok(studyTaskService.updateTask(id, dto, getUserId(auth)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTask(
            @PathVariable Long id,
            Authentication auth) {
        studyTaskService.deleteTask(id, getUserId(auth));
        return ResponseEntity.noContent().build();
    }
}
