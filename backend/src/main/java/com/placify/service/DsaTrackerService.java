package com.placify.service;

import com.placify.dto.DsaTrackerDTO;
import com.placify.entity.DsaTracker;
import com.placify.exception.ResourceNotFoundException;
import com.placify.repository.DsaTrackerRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class DsaTrackerService {

    private final DsaTrackerRepository dsaTrackerRepository;

    public DsaTrackerService(DsaTrackerRepository dsaTrackerRepository) {
        this.dsaTrackerRepository = dsaTrackerRepository;
    }

    public List<DsaTrackerDTO> getAllTopics(Long userId) {
        return dsaTrackerRepository.findAllByUserId(userId)
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    public DsaTrackerDTO getTopicById(Long id, Long userId) {
        DsaTracker topic = dsaTrackerRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("DSA Topic", "id", id));
        return toDTO(topic);
    }

    public DsaTrackerDTO createTopic(DsaTrackerDTO dto, Long userId) {
        DsaTracker topic = toEntity(dto);
        topic.setUserId(userId);
        // Auto-calculate progress
        recalcProgress(topic);
        return toDTO(dsaTrackerRepository.save(topic));
    }

    public DsaTrackerDTO updateTopic(Long id, DsaTrackerDTO dto, Long userId) {
        DsaTracker existing = dsaTrackerRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("DSA Topic", "id", id));

        existing.setTopicName(dto.getTopicName());
        if (dto.getTotalQuestions() != null) existing.setTotalQuestions(dto.getTotalQuestions());
        if (dto.getSolvedQuestions() != null) existing.setSolvedQuestions(dto.getSolvedQuestions());
        if (dto.getDifficultyLevel() != null) existing.setDifficultyLevel(dto.getDifficultyLevel());
        existing.setLastUpdatedDate(dto.getLastUpdatedDate() != null ? dto.getLastUpdatedDate() : dto.getLastPracticedDate());
        existing.setNotes(dto.getNotes());

        // Recalculate progress from solved/total
        recalcProgress(existing);

        // Allow manual override if explicitly provided
        if (dto.getProgressPercentage() != null && dto.getSolvedQuestions() == null) {
            existing.setProgressPercentage(dto.getProgressPercentage());
        }

        return toDTO(dsaTrackerRepository.save(existing));
    }

    public void deleteTopic(Long id, Long userId) {
        dsaTrackerRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("DSA Topic", "id", id));
        dsaTrackerRepository.deleteById(id);
    }

    public Double getAverageProgress() {
        Double avg = dsaTrackerRepository.findAverageProgress();
        return avg != null ? Math.round(avg * 10.0) / 10.0 : 0.0;
    }

    public Double getAverageProgressByUser(Long userId) {
        Double avg = dsaTrackerRepository.findAverageProgressByUserId(userId);
        return avg != null ? Math.round(avg * 10.0) / 10.0 : 0.0;
    }

    public long getTotalSolvedByUser(Long userId) {
        Long total = dsaTrackerRepository.sumSolvedQuestionsByUserId(userId);
        return total != null ? total : 0L;
    }

    public long getCompletedTopicsCountByUser(Long userId) {
        return dsaTrackerRepository.countCompletedTopicsByUserId(userId);
    }

    private void recalcProgress(DsaTracker topic) {
        if (topic.getTotalQuestions() != null && topic.getTotalQuestions() > 0
                && topic.getSolvedQuestions() != null) {
            int pct = Math.min(100,
                (int) Math.round((topic.getSolvedQuestions() * 100.0) / topic.getTotalQuestions()));
            topic.setProgressPercentage(pct);
        }
    }

    private DsaTrackerDTO toDTO(DsaTracker topic) {
        DsaTrackerDTO dto = new DsaTrackerDTO();
        dto.setId(topic.getId());
        dto.setTopicName(topic.getTopicName());
        dto.setTotalQuestions(topic.getTotalQuestions() != null ? topic.getTotalQuestions() : 100);
        dto.setSolvedQuestions(topic.getSolvedQuestions() != null ? topic.getSolvedQuestions() : 0);
        dto.setProgressPercentage(topic.getProgressPercentage() != null ? topic.getProgressPercentage() : 0);
        dto.setDifficultyLevel(topic.getDifficultyLevel());
        dto.setLastUpdatedDate(topic.getLastUpdatedDate());
        dto.setNotes(topic.getNotes());
        return dto;
    }

    private DsaTracker toEntity(DsaTrackerDTO dto) {
        DsaTracker topic = new DsaTracker();
        topic.setTopicName(dto.getTopicName());
        topic.setTotalQuestions(dto.getTotalQuestions() != null ? dto.getTotalQuestions() : 100);
        topic.setSolvedQuestions(dto.getSolvedQuestions() != null ? dto.getSolvedQuestions() : 0);
        topic.setProgressPercentage(dto.getProgressPercentage() != null ? dto.getProgressPercentage() : 0);
        topic.setDifficultyLevel(dto.getDifficultyLevel());
        topic.setLastUpdatedDate(dto.getLastUpdatedDate() != null ? dto.getLastUpdatedDate() : dto.getLastPracticedDate());
        topic.setNotes(dto.getNotes());
        return topic;
    }
}
