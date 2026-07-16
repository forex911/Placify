package com.placify.dto;

import com.placify.entity.StudyTask.TaskStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public class StudyTaskDTO {

    private Long id;

    @NotBlank(message = "Task name is required")
    private String taskName;

    private LocalDate dueDate;

    @NotNull(message = "Status is required")
    private TaskStatus status;

    public StudyTaskDTO() {}

    public StudyTaskDTO(Long id, String taskName, LocalDate dueDate, TaskStatus status) {
        this.id = id;
        this.taskName = taskName;
        this.dueDate = dueDate;
        this.status = status;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTaskName() { return taskName; }
    public void setTaskName(String taskName) { this.taskName = taskName; }

    public LocalDate getDueDate() { return dueDate; }
    public void setDueDate(LocalDate dueDate) { this.dueDate = dueDate; }

    public TaskStatus getStatus() { return status; }
    public void setStatus(TaskStatus status) { this.status = status; }
}
