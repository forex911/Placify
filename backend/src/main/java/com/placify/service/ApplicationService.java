package com.placify.service;

import com.placify.dto.ApplicationDTO;
import com.placify.entity.Application;
import com.placify.entity.Application.ApplicationStatus;
import com.placify.exception.ResourceNotFoundException;
import com.placify.repository.ApplicationRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ApplicationService {

    private final ApplicationRepository applicationRepository;

    public ApplicationService(ApplicationRepository applicationRepository) {
        this.applicationRepository = applicationRepository;
    }

    public List<ApplicationDTO> getAllApplications(Long userId, String status) {
        List<Application> applications;
        if (status != null && !status.isBlank()) {
            ApplicationStatus appStatus = ApplicationStatus.valueOf(status);
            applications = applicationRepository.findByUserIdAndStatus(userId, appStatus);
        } else {
            applications = applicationRepository.findAllByUserId(userId);
        }
        return applications.stream().map(this::toDTO).collect(Collectors.toList());
    }

    public ApplicationDTO getApplicationById(Long id, Long userId) {
        Application app = applicationRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Application", "id", id));
        return toDTO(app);
    }

    public ApplicationDTO createApplication(ApplicationDTO dto, Long userId) {
        Application app = toEntity(dto);
        app.setUserId(userId);
        app.setCreatedBy(userId);
        app.setUpdatedBy(userId);
        return toDTO(applicationRepository.save(app));
    }

    public ApplicationDTO updateApplication(Long id, ApplicationDTO dto, Long userId) {
        Application existing = applicationRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Application", "id", id));

        existing.setCompanyName(dto.getCompanyName());
        existing.setRole(dto.getRole());
        existing.setAppliedDate(dto.getAppliedDate());
        existing.setDeadline(dto.getDeadline());
        existing.setStatus(dto.getStatus());
        existing.setLocation(dto.getLocation());
        existing.setCompanyLink(dto.getCompanyLink());
        existing.setUpdatedBy(userId);

        return toDTO(applicationRepository.save(existing));
    }

    public void deleteApplication(Long id, Long userId) {
        applicationRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Application", "id", id));
        applicationRepository.deleteById(id);
    }

    public long getUpcomingDeadlines(Long userId) {
        return applicationRepository
                .findByUserIdAndDeadlineBetween(userId, LocalDate.now(), LocalDate.now().plusDays(7))
                .size();
    }

    public long getSelectedCount(Long userId) {
        return applicationRepository.countByUserIdAndStatus(userId, ApplicationStatus.Selected);
    }

    public long getRejectedCount(Long userId) {
        return applicationRepository.countByUserIdAndStatus(userId, ApplicationStatus.Rejected);
    }

    public long getInterviewCount(Long userId) {
        return applicationRepository.countByUserIdAndStatus(userId, ApplicationStatus.Interview_Scheduled);
    }

    private ApplicationDTO toDTO(Application app) {
        ApplicationDTO dto = new ApplicationDTO();
        dto.setId(app.getId());
        dto.setCompanyName(app.getCompanyName());
        dto.setRole(app.getRole());
        dto.setAppliedDate(app.getAppliedDate());
        dto.setDeadline(app.getDeadline());
        dto.setStatus(app.getStatus());
        dto.setLocation(app.getLocation());
        dto.setCompanyLink(app.getCompanyLink());
        dto.setCreatedBy(app.getCreatedBy());
        dto.setUpdatedBy(app.getUpdatedBy());
        dto.setCreatedAt(app.getCreatedAt());
        dto.setUpdatedAt(app.getUpdatedAt());
        return dto;
    }

    private Application toEntity(ApplicationDTO dto) {
        Application app = new Application();
        app.setCompanyName(dto.getCompanyName());
        app.setRole(dto.getRole());
        app.setAppliedDate(dto.getAppliedDate());
        app.setDeadline(dto.getDeadline());
        app.setStatus(dto.getStatus());
        app.setLocation(dto.getLocation());
        app.setCompanyLink(dto.getCompanyLink());
        return app;
    }
}
