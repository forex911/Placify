package com.placify.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "subject_progress",
       uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "subject"}))
public class SubjectProgress {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "subject", nullable = false)
    @Enumerated(EnumType.STRING)
    private Subject subject;

    @Column(name = "level", nullable = false)
    @Enumerated(EnumType.STRING)
    private Level level = Level.BEGINNER;

    @Column(name = "topics_completed")
    private Integer topicsCompleted = 0;

    @Column(name = "total_topics")
    private Integer totalTopics = 30;

    @Column(name = "progress_percentage")
    private Integer progressPercentage = 0;

    @Column(name = "last_updated_date")
    private LocalDate lastUpdatedDate;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public enum Subject {
        OPERATING_SYSTEMS,
        DBMS,
        COMPUTER_NETWORKS,
        OOP,
        APTITUDE,
        VERBAL_ABILITY
    }

    public enum Level {
        BEGINNER, INTERMEDIATE, ADVANCED
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        if (this.topicsCompleted == null) this.topicsCompleted = 0;
        if (this.totalTopics == null) this.totalTopics = 30;
        if (this.progressPercentage == null) this.progressPercentage = 0;
        if (this.level == null) this.level = Level.BEGINNER;
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
        if (this.totalTopics != null && this.totalTopics > 0 && this.topicsCompleted != null) {
            this.progressPercentage = Math.min(100,
                (int) Math.round((this.topicsCompleted * 100.0) / this.totalTopics));
        }
    }

    public SubjectProgress() {}

    public SubjectProgress(Long userId, Subject subject) {
        this.userId = userId;
        this.subject = subject;
        this.level = Level.BEGINNER;
        this.topicsCompleted = 0;
        this.totalTopics = 30;
        this.progressPercentage = 0;
    }

    // â”€â”€ Getters & Setters â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public Subject getSubject() { return subject; }
    public void setSubject(Subject subject) { this.subject = subject; }

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
}
