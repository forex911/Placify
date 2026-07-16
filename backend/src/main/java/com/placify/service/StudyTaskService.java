package com.placify.service;

import com.placify.dto.StudyTaskDTO;
import com.placify.entity.StudyTask;
import com.placify.entity.StudyTask.TaskStatus;
import com.placify.exception.ResourceNotFoundException;
import com.placify.repository.StudyTaskRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class StudyTaskService {

    private final StudyTaskRepository studyTaskRepository;

    public StudyTaskService(StudyTaskRepository studyTaskRepository) {
        this.studyTaskRepository = studyTaskRepository;
    }

    public List<StudyTaskDTO> getAllTasks(Long userId) {
        return studyTaskRepository.findAllByUserId(userId)
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    public StudyTaskDTO getTaskById(Long id, Long userId) {
        StudyTask task = studyTaskRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Study Task", "id", id));
        return toDTO(task);
    }

    public StudyTaskDTO createTask(StudyTaskDTO dto, Long userId) {
        StudyTask task = toEntity(dto);
        task.setUserId(userId);
        return toDTO(studyTaskRepository.save(task));
    }

    public StudyTaskDTO updateTask(Long id, StudyTaskDTO dto, Long userId) {
        StudyTask existing = studyTaskRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Study Task", "id", id));

        existing.setTaskName(dto.getTaskName());
        existing.setDueDate(dto.getDueDate());
        existing.setStatus(dto.getStatus());

        return toDTO(studyTaskRepository.save(existing));
    }

    public void deleteTask(Long id, Long userId) {
        studyTaskRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Study Task", "id", id));
        studyTaskRepository.deleteById(id);
    }

    public long countPendingTasks(Long userId) {
        return studyTaskRepository.countByUserIdAndStatus(userId, TaskStatus.Pending);
    }

    private StudyTaskDTO toDTO(StudyTask task) {
        StudyTaskDTO dto = new StudyTaskDTO();
        dto.setId(task.getId());
        dto.setTaskName(task.getTaskName());
        dto.setDueDate(task.getDueDate());
        dto.setStatus(task.getStatus());
        return dto;
    }

    private StudyTask toEntity(StudyTaskDTO dto) {
        StudyTask task = new StudyTask();
        task.setTaskName(dto.getTaskName());
        task.setDueDate(dto.getDueDate());
        task.setStatus(dto.getStatus());
        return task;
    }
}
