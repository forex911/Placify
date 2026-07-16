package com.placify.dto;

import jakarta.validation.constraints.NotBlank;
import java.time.LocalDateTime;

public class NoteDTO {

    private Long id;

    @NotBlank(message = "Title is required")
    private String title;

    private String content;

    private LocalDateTime createdAt;

    public NoteDTO() {}

    public NoteDTO(Long id, String title, String content, LocalDateTime createdAt) {
        this.id = id;
        this.title = title;
        this.content = content;
        this.createdAt = createdAt;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
