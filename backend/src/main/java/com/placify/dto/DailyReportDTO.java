package com.placify.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class DailyReportDTO {

    private Long id;

    @NotNull(message = "Report date is required")
    private LocalDate reportDate;

    @Min(0)
    private Double hoursStudied = 0.0;

    @Min(0)
    private Integer dsaQuestionsSolved = 0;

    private String topicsLearned;

    @Min(0)
    private Integer aptitudeQuestionsSolved = 0;

    private Boolean verbalPracticeDone = false;

    private String notes;

    @Min(1)
    @Max(10)
    private Integer productivityRating = 5;

    private LocalDateTime createdAt;

    // For admin views
    private Long userId;
    private String username;

    public DailyReportDTO() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

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

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
}
