package com.placify.service;

import com.placify.dto.HackathonDTO;
import com.placify.entity.Hackathon;
import com.placify.repository.HackathonRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class HackathonService {

    private final HackathonRepository hackathonRepository;

    public HackathonService(HackathonRepository hackathonRepository) {
        this.hackathonRepository = hackathonRepository;
    }

    public List<HackathonDTO> getAllForUser(Long userId) {
        return hackathonRepository.findByUserIdOrderByDateDesc(userId)
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    public List<HackathonDTO> getAllForAdmin() {
        return hackathonRepository.findAllByOrderByDateDesc()
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    public HackathonDTO create(Long userId, HackathonDTO dto) {
        Hackathon h = new Hackathon();
        h.setUserId(userId);
        updateEntity(h, dto);
        return toDTO(hackathonRepository.save(h));
    }

    public HackathonDTO update(Long id, Long userId, HackathonDTO dto) {
        Hackathon h = hackathonRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Hackathon not found"));
        if (!h.getUserId().equals(userId)) {
            throw new RuntimeException("Unauthorized");
        }
        updateEntity(h, dto);
        return toDTO(hackathonRepository.save(h));
    }

    public void delete(Long id, Long userId) {
        Hackathon h = hackathonRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Hackathon not found"));
        if (!h.getUserId().equals(userId)) {
            throw new RuntimeException("Unauthorized");
        }
        hackathonRepository.delete(h);
    }

    private void updateEntity(Hackathon h, HackathonDTO dto) {
        h.setHackathonName(dto.getHackathonName());
        h.setProjectTitle(dto.getProjectTitle());
        h.setTeamSize(dto.getTeamSize());
        h.setTechStack(dto.getTechStack());
        h.setProjectLink(dto.getProjectLink());
        h.setDate(dto.getDate());
        h.setStatus(dto.getStatus());
    }

    private HackathonDTO toDTO(Hackathon h) {
        HackathonDTO dto = new HackathonDTO();
        dto.setId(h.getId());
        dto.setUserId(h.getUserId());
        dto.setHackathonName(h.getHackathonName());
        dto.setProjectTitle(h.getProjectTitle());
        dto.setTeamSize(h.getTeamSize());
        dto.setTechStack(h.getTechStack());
        dto.setProjectLink(h.getProjectLink());
        dto.setDate(h.getDate());
        dto.setStatus(h.getStatus());
        dto.setCreatedAt(h.getCreatedAt());
        return dto;
    }
}
