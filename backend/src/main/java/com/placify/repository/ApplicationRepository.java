package com.placify.repository;

import com.placify.entity.Application;
import com.placify.entity.Application.ApplicationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface ApplicationRepository extends JpaRepository<Application, Long> {

    // â”€â”€ Existing queries â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    List<Application> findByStatus(ApplicationStatus status);
    List<Application> findByDeadlineBetween(LocalDate start, LocalDate end);
    long countByStatus(ApplicationStatus status);
    List<Application> findByDeadlineAfterOrderByDeadlineAsc(LocalDate date);

    // â”€â”€ User-scoped queries â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    List<Application> findAllByUserId(Long userId);
    List<Application> findByUserIdAndStatus(Long userId, ApplicationStatus status);
    Optional<Application> findByIdAndUserId(Long id, Long userId);
    long countByUserId(Long userId);

    // User-scoped deadline query
    List<Application> findByUserIdAndDeadlineBetween(Long userId, LocalDate start, LocalDate end);
    long countByUserIdAndStatus(Long userId, ApplicationStatus status);
}
