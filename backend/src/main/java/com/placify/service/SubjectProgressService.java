package com.placify.service;

import com.placify.dto.SubjectProgressDTO;
import com.placify.entity.SubjectProgress;
import com.placify.entity.SubjectProgress.Subject;
import com.placify.entity.SubjectProgress.Level;
import com.placify.repository.SubjectProgressRepository;
import com.placify.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class SubjectProgressService {

    private final SubjectProgressRepository subjectProgressRepository;
    private final UserRepository userRepository;

    public SubjectProgressService(SubjectProgressRepository subjectProgressRepository,
                                   UserRepository userRepository) {
        this.subjectProgressRepository = subjectProgressRepository;
        this.userRepository = userRepository;
    }

    public List<SubjectProgressDTO> getAllForUser(Long userId) {
        // Ensure all 6 subjects exist for user
        ensureSubjectsExist(userId);
        return subjectProgressRepository.findAllByUserId(userId)
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    public SubjectProgressDTO upsertSubject(Long userId, Subject subject, SubjectProgressDTO dto) {
        SubjectProgress sp = subjectProgressRepository.findByUserIdAndSubject(userId, subject)
                .orElseGet(() -> new SubjectProgress(userId, subject));

        if (dto.getLevel() != null) sp.setLevel(dto.getLevel());
        if (dto.getTopicsCompleted() != null) sp.setTopicsCompleted(dto.getTopicsCompleted());
        if (dto.getTotalTopics() != null) sp.setTotalTopics(dto.getTotalTopics());
        sp.setLastUpdatedDate(LocalDate.now());
        if (dto.getNotes() != null) sp.setNotes(dto.getNotes());

        // Recalculate progress
        if (sp.getTotalTopics() != null && sp.getTotalTopics() > 0 && sp.getTopicsCompleted() != null) {
            int pct = Math.min(100,
                (int) Math.round((sp.getTopicsCompleted() * 100.0) / sp.getTotalTopics()));
            sp.setProgressPercentage(pct);
        }

        return toDTO(subjectProgressRepository.save(sp));
    }

    public List<SubjectProgressDTO> getAllForAdmin() {
        return subjectProgressRepository.findAllOrderByUserIdAndSubject()
                .stream().map(sp -> {
                    SubjectProgressDTO dto = toDTO(sp);
                    userRepository.findById(sp.getUserId()).ifPresent(u -> {
                        dto.setUserId(u.getId());
                        dto.setUsername(u.getUsername());
                    });
                    return dto;
                }).collect(Collectors.toList());
    }

    private void ensureSubjectsExist(Long userId) {
        Arrays.stream(Subject.values()).forEach(subject -> {
            if (!subjectProgressRepository.existsByUserIdAndSubject(userId, subject)) {
                subjectProgressRepository.save(new SubjectProgress(userId, subject));
            }
        });
    }

    private SubjectProgressDTO toDTO(SubjectProgress sp) {
        SubjectProgressDTO dto = new SubjectProgressDTO();
        dto.setId(sp.getId());
        dto.setSubject(sp.getSubject());
        dto.setSubjectDisplayName(SubjectProgressDTO.formatSubjectName(sp.getSubject()));
        dto.setLevel(sp.getLevel() != null ? sp.getLevel() : Level.BEGINNER);
        dto.setTopicsCompleted(sp.getTopicsCompleted() != null ? sp.getTopicsCompleted() : 0);
        dto.setTotalTopics(sp.getTotalTopics() != null ? sp.getTotalTopics() : 30);
        dto.setProgressPercentage(sp.getProgressPercentage() != null ? sp.getProgressPercentage() : 0);
        dto.setLastUpdatedDate(sp.getLastUpdatedDate());
        dto.setNotes(sp.getNotes());
        dto.setCreatedAt(sp.getCreatedAt());
        dto.setUpdatedAt(sp.getUpdatedAt());
        return dto;
    }
}
