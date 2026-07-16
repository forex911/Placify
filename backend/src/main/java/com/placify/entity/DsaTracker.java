package com.placify.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "dsa_tracker")
public class DsaTracker {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "topic_name", nullable = false)
    private String topicName;

    @Column(name = "total_questions")
    private Integer totalQuestions = 100;

    @Column(name = "solved_questions")
    private Integer solvedQuestions = 0;

    @Column(name = "progress_percentage", nullable = false)
    private Integer progressPercentage = 0;

    @Column(name = "difficulty_level")
    @Enumerated(EnumType.STRING)
    private DifficultyLevel difficultyLevel = DifficultyLevel.MIXED;

    @Column(name = "last_updated_date")
    private LocalDate lastUpdatedDate;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public enum DifficultyLevel {
        EASY, MEDIUM, HARD, MIXED
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        if (this.progressPercentage == null) this.progressPercentage = 0;
        if (this.totalQuestions == null) this.totalQuestions = 100;
        if (this.solvedQuestions == null) this.solvedQuestions = 0;
        if (this.difficultyLevel == null) this.difficultyLevel = DifficultyLevel.MIXED;
    }

    @PreUpdate
    protected void onUpdate() {
        // Recalculate progress based on solved/total
        if (this.totalQuestions != null && this.totalQuestions > 0 && this.solvedQuestions != null) {
            this.progressPercentage = Math.min(100, (int) Math.round((this.solvedQuestions * 100.0) / this.totalQuestions));
        }
    }

    public DsaTracker() {}

    // â”€â”€ Getters & Setters â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

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
    public void setLastUpdatedDate(LocalDate lastUpdatedDate) { this.lastUpdatedDate = lastUpdatedDate; }

    // Backward-compat alias for old field name
    public LocalDate getLastPracticedDate() { return lastUpdatedDate; }
    public void setLastPracticedDate(LocalDate date) { this.lastUpdatedDate = date; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
