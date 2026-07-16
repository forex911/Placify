package com.placify.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "daily_reports")
public class DailyReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "report_date", nullable = false)
    private LocalDate reportDate;

    @Column(name = "hours_studied")
    private Double hoursStudied = 0.0;

    @Column(name = "dsa_questions_solved")
    private Integer dsaQuestionsSolved = 0;

    @Column(name = "topics_learned", columnDefinition = "TEXT")
    private String topicsLearned;

    @Column(name = "aptitude_questions_solved")
    private Integer aptitudeQuestionsSolved = 0;

    @Column(name = "verbal_practice_done")
    private Boolean verbalPracticeDone = false;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "productivity_rating")
    private Integer productivityRating = 5; // 1-10

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        if (this.hoursStudied == null) this.hoursStudied = 0.0;
        if (this.dsaQuestionsSolved == null) this.dsaQuestionsSolved = 0;
        if (this.aptitudeQuestionsSolved == null) this.aptitudeQuestionsSolved = 0;
        if (this.verbalPracticeDone == null) this.verbalPracticeDone = false;
        if (this.productivityRating == null) this.productivityRating = 5;
    }

    public DailyReport() {}

    // â”€â”€ Getters & Setters â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public LocalDate getReportDate() { return reportDate; }
    public void setReportDate(LocalDate reportDate) { this.reportDate = reportDate; }

    public Double getHoursStudied() { return hoursStudied; }
    public void setHoursStudied(Double hoursStudied) { this.hoursStudied = hoursStudied; }

    public Integer getDsaQuestionsSolved() { return dsaQuestionsSolved; }
    public void setDsaQuestionsSolved(Integer dsaQuestionsSolved) { this.dsaQuestionsSolved = dsaQuestionsSolved; }

    public String getTopicsLearned() { return topicsLearned; }
    public void setTopicsLearned(String topicsLearned) { this.topicsLearned = topicsLearned; }

    public Integer getAptitudeQuestionsSolved() { return aptitudeQuestionsSolved; }
    public void setAptitudeQuestionsSolved(Integer aptitudeQuestionsSolved) { this.aptitudeQuestionsSolved = aptitudeQuestionsSolved; }

    public Boolean getVerbalPracticeDone() { return verbalPracticeDone; }
    public void setVerbalPracticeDone(Boolean verbalPracticeDone) { this.verbalPracticeDone = verbalPracticeDone; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public Integer getProductivityRating() { return productivityRating; }
    public void setProductivityRating(Integer productivityRating) { this.productivityRating = productivityRating; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
