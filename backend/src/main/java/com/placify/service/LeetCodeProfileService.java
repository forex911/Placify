package com.placify.service;

import com.placify.dto.LeetCodeProfileDTO;
import com.placify.entity.LeetCodeProfile;
import com.placify.repository.LeetCodeProfileRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class LeetCodeProfileService {

    private final LeetCodeProfileRepository leetCodeProfileRepository;

    public LeetCodeProfileService(LeetCodeProfileRepository leetCodeProfileRepository) {
        this.leetCodeProfileRepository = leetCodeProfileRepository;
    }

    public Optional<LeetCodeProfileDTO> getProfile(Long userId) {
        return leetCodeProfileRepository.findByUserId(userId).map(this::toDTO);
    }

    public LeetCodeProfileDTO upsertProfile(Long userId, LeetCodeProfileDTO dto) {
        LeetCodeProfile profile = leetCodeProfileRepository.findByUserId(userId)
                .orElse(new LeetCodeProfile());
        profile.setUserId(userId);
        profile.setUsername(dto.getUsername());
        profile.setTotalSolved(dto.getTotalSolved() != null ? dto.getTotalSolved() : 0);
        profile.setEasySolved(dto.getEasySolved() != null ? dto.getEasySolved() : 0);
        profile.setMediumSolved(dto.getMediumSolved() != null ? dto.getMediumSolved() : 0);
        profile.setHardSolved(dto.getHardSolved() != null ? dto.getHardSolved() : 0);
        profile.setRanking(dto.getRanking());
        profile.setLastSyncTime(LocalDateTime.now());
        return toDTO(leetCodeProfileRepository.save(profile));
    }

    private LeetCodeProfileDTO toDTO(LeetCodeProfile profile) {
        LeetCodeProfileDTO dto = new LeetCodeProfileDTO();
        dto.setId(profile.getId());
        dto.setUsername(profile.getUsername());
        dto.setTotalSolved(profile.getTotalSolved());
        dto.setEasySolved(profile.getEasySolved());
        dto.setMediumSolved(profile.getMediumSolved());
        dto.setHardSolved(profile.getHardSolved());
        dto.setRanking(profile.getRanking());
        dto.setLastSyncTime(profile.getLastSyncTime());
        dto.setCreatedAt(profile.getCreatedAt());
        return dto;
    }
}
