package com.placify.controller;

import com.placify.dto.NoteDTO;
import com.placify.service.NoteService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notes")
public class NoteController {

    private final NoteService noteService;

    public NoteController(NoteService noteService) {
        this.noteService = noteService;
    }

    private Long getUserId(Authentication auth) {
        return (Long) auth.getCredentials();
    }

    @GetMapping
    public ResponseEntity<List<NoteDTO>> getAllNotes(Authentication auth) {
        return ResponseEntity.ok(noteService.getAllNotes(getUserId(auth)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<NoteDTO> getNoteById(
            @PathVariable Long id,
            Authentication auth) {
        return ResponseEntity.ok(noteService.getNoteById(id, getUserId(auth)));
    }

    @PostMapping
    public ResponseEntity<NoteDTO> createNote(
            @Valid @RequestBody NoteDTO dto,
            Authentication auth) {
        NoteDTO created = noteService.createNote(dto, getUserId(auth));
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<NoteDTO> updateNote(
            @PathVariable Long id,
            @Valid @RequestBody NoteDTO dto,
            Authentication auth) {
        return ResponseEntity.ok(noteService.updateNote(id, dto, getUserId(auth)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteNote(
            @PathVariable Long id,
            Authentication auth) {
        noteService.deleteNote(id, getUserId(auth));
        return ResponseEntity.noContent().build();
    }
}
