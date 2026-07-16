package com.placify.dto;

import com.placify.entity.SubjectProgress.Subject;
import com.placify.entity.SubjectProgress.Level;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class SubjectProgressDTO {

    private Long id;

    @NotNull(message = "Subject is required")
    private Subject subject;

    private String subjectDisplayName;

    private Level level = Level.BEGINNER;

    @Min(0)
    private Integer topicsCompleted = 0;

    @Min(1)
    private Integer totalTopics = 30;

    @Min(0)
    @Max(100)
    private Integer progressPercentage = 0;

    private LocalDate lastUpdatedDate;
    private String notes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // For admin views
    private Long userId;
    private String username;

    public SubjectProgressDTO() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Subject getSubject() { return subject; }
    public void setSubject(Subject subject) {
        this.subject = subject;
        this.subjectDisplayName = formatSubjectName(subject);
    }

    public String getSubjectDisplayName() { return subjectDisplayName; }
    public void setSubjectDisplayName(String subjectDisplayName) { this.subjectDisplayName = subjectDisplayName; }

    public Level getLevel() { return level; }
    public void setLevel(Level level) { this.level = level; }

    public Integer getTopicsCompleted() { return topicsCompleted; }
    public void setTopicsCompleted(Integer topicsCompleted) { this.topicsCompleted = topicsCompleted; }

    public Integer getTotalTopics() { return totalTopics; }
    public void setTotalTopics(Integer totalTopics) { this.totalTopics = totalTopics; }

    public Integer getProgressPercentage() { return progressPercentage; }
    public void setProgressPercentage(Integer progressPercentage) { this.progressPercentage = progressPercentage; }

    public LocalDate getLastUpdatedDate() { return lastUpdatedDate; }
    public void setLastUpdatedDate(LocalDate lastUpdatedDate) { this.lastUpdatedDate = lastUpdatedDate; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public static String formatSubjectName(Subject subject) {
        if (subject == null) return "";
        return switch (subject) {
            case OPERATING_SYSTEMS -> "Operating Systems";
            case DBMS -> "DBMS";
            case COMPUTER_NETWORKS -> "Computer Networks";
            case OOP -> "OOP";
            case APTITUDE -> "Aptitude";
            case VERBAL_ABILITY -> "Verbal Ability";
        };
    }
}
