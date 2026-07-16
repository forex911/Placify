package com.placify.dto;

import java.time.LocalDateTime;

public class LeetCodeProfileDTO {

    private Long id;
    private String username;
    private Integer totalSolved = 0;
    private Integer easySolved = 0;
    private Integer mediumSolved = 0;
    private Integer hardSolved = 0;
    private Long ranking;
    private LocalDateTime lastSyncTime;
    private LocalDateTime createdAt;

    public LeetCodeProfileDTO() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public Integer getTotalSolved() { return totalSolved; }
    public void setTotalSolved(Integer totalSolved) { this.totalSolved = totalSolved; }

    public Integer getEasySolved() { return easySolved; }
    public void setEasySolved(Integer easySolved) { this.easySolved = easySolved; }

    public Integer getMediumSolved() { return mediumSolved; }
    public void setMediumSolved(Integer mediumSolved) { this.mediumSolved = mediumSolved; }

    public Integer getHardSolved() { return hardSolved; }
    public void setHardSolved(Integer hardSolved) { this.hardSolved = hardSolved; }

    public Long getRanking() { return ranking; }
    public void setRanking(Long ranking) { this.ranking = ranking; }

    public LocalDateTime getLastSyncTime() { return lastSyncTime; }
    public void setLastSyncTime(LocalDateTime lastSyncTime) { this.lastSyncTime = lastSyncTime; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
