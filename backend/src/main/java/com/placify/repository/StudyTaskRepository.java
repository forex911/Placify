package com.placify.repository;

import com.placify.entity.StudyTask;
import com.placify.entity.StudyTask.TaskStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StudyTaskRepository extends JpaRepository<StudyTask, Long> {

    // â”€â”€ Existing queries â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    List<StudyTask> findByStatus(TaskStatus status);
    long countByStatus(TaskStatus status);

    // â”€â”€ User-scoped queries â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    List<StudyTask> findAllByUserId(Long userId);
    List<StudyTask> findByUserIdAndStatus(Long userId, TaskStatus status);
    Optional<StudyTask> findByIdAndUserId(Long id, Long userId);
    long countByUserId(Long userId);
    long countByUserIdAndStatus(Long userId, TaskStatus status);
}
