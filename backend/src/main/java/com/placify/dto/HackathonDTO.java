package com.placify.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import com.placify.entity.Hackathon.HackathonStatus;

public class HackathonDTO {
    private Long id;
    private Long userId;
    private String hackathonName;
    private String projectTitle;
    private Integer teamSize;
    private String techStack;
    private String projectLink;
    private LocalDate date;
    private HackathonStatus status;
    private LocalDateTime createdAt;

    public HackathonDTO() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public String getHackathonName() { return hackathonName; }
    public void setHackathonName(String hackathonName) { this.hackathonName = hackathonName; }
    public String getProjectTitle() { return projectTitle; }
    public void setProjectTitle(String projectTitle) { this.projectTitle = projectTitle; }
    public Integer getTeamSize() { return teamSize; }
    public void setTeamSize(Integer teamSize) { this.teamSize = teamSize; }
    public String getTechStack() { return techStack; }
    public void setTechStack(String techStack) { this.techStack = techStack; }
    public String getProjectLink() { return projectLink; }
    public void setProjectLink(String projectLink) { this.projectLink = projectLink; }
    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }
    public HackathonStatus getStatus() { return status; }
    public void setStatus(HackathonStatus status) { this.status = status; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
