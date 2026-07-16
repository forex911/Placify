package com.placify.dto;

import com.placify.entity.DsaTracker.DifficultyLevel;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import java.time.LocalDate;

public class DsaTrackerDTO {

    private Long id;

    @NotBlank(message = "Topic name is required")
    private String topicName;

    @Min(value = 0)
    private Integer totalQuestions = 100;

    @Min(value = 0)
    private Integer solvedQuestions = 0;

    @Min(value = 0, message = "Progress must be at least 0")
    @Max(value = 100, message = "Progress cannot exceed 100")
    private Integer progressPercentage = 0;

    private DifficultyLevel difficultyLevel = DifficultyLevel.MIXED;

    private LocalDate lastUpdatedDate;

    // backward compat alias
    private LocalDate lastPracticedDate;

    private String notes;

    public DsaTrackerDTO() {}

    public DsaTrackerDTO(Long id, String topicName, Integer totalQuestions, Integer solvedQuestions,
                         Integer progressPercentage, DifficultyLevel difficultyLevel,
                         LocalDate lastUpdatedDate, String notes) {
        this.id = id;
        this.topicName = topicName;
        this.totalQuestions = totalQuestions;
        this.solvedQuestions = solvedQuestions;
        this.progressPercentage = progressPercentage;
        this.difficultyLevel = difficultyLevel;
        this.lastUpdatedDate = lastUpdatedDate;
        this.lastPracticedDate = lastUpdatedDate;
        this.notes = notes;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTopicName() { return topicName; }
    public void setTopicName(String topicName) { this.topicName = topicName; }

    public Integer getTotalQuestions() { return totalQuestions; }
    public void setTotalQuestions(Integer totalQuestions) { this.totalQuestions = totalQuestions; }

    public Integer getSolvedQuestions() { return solvedQuestions; }
    public void setSolvedQuestions(Integer solvedQuestions) { this.solvedQuestions = solvedQuestions; }

    public Integer getProgressPercentage() { return progressPercentage; }
    public void setProgressPercentage(Integer progressPercentage) { this.progressPercentage = progressPercentage; }

    public DifficultyLevel getDifficultyLevel() { return difficultyLevel; }
    public void setDifficultyLevel(DifficultyLevel difficultyLevel) { this.difficultyLevel = difficultyLevel; }

    public LocalDate getLastUpdatedDate() { return lastUpdatedDate; }
    public void setLastUpdatedDate(LocalDate lastUpdatedDate) {
        this.lastUpdatedDate = lastUpdatedDate;
        this.lastPracticedDate = lastUpdatedDate;
    }

    public LocalDate getLastPracticedDate() { return lastUpdatedDate; }
    public void setLastPracticedDate(LocalDate date) {
        this.lastPracticedDate = date;
        this.lastUpdatedDate = date;
    }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
