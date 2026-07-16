package com.placify.service;

import com.placify.dto.NoteDTO;
import com.placify.entity.Note;
import com.placify.exception.ResourceNotFoundException;
import com.placify.repository.NoteRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class NoteService {

    private final NoteRepository noteRepository;

    public NoteService(NoteRepository noteRepository) {
        this.noteRepository = noteRepository;
    }

    public List<NoteDTO> getAllNotes(Long userId) {
        return noteRepository.findAllByUserIdOrderByCreatedAtDesc(userId)
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    public NoteDTO getNoteById(Long id, Long userId) {
        Note note = noteRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Note", "id", id));
        return toDTO(note);
    }

    public NoteDTO createNote(NoteDTO dto, Long userId) {
        Note note = toEntity(dto);
        note.setUserId(userId);
        return toDTO(noteRepository.save(note));
    }

    public NoteDTO updateNote(Long id, NoteDTO dto, Long userId) {
        Note existing = noteRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Note", "id", id));

        existing.setTitle(dto.getTitle());
        existing.setContent(dto.getContent());

        return toDTO(noteRepository.save(existing));
    }

    public void deleteNote(Long id, Long userId) {
        noteRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Note", "id", id));
        noteRepository.deleteById(id);
    }

    private NoteDTO toDTO(Note note) {
        NoteDTO dto = new NoteDTO();
        dto.setId(note.getId());
        dto.setTitle(note.getTitle());
        dto.setContent(note.getContent());
        dto.setCreatedAt(note.getCreatedAt());
        return dto;
    }

    private Note toEntity(NoteDTO dto) {
        Note note = new Note();
        note.setTitle(dto.getTitle());
        note.setContent(dto.getContent());
        return note;
    }
}
