package com.placify.dto;

import java.time.LocalDate;

public class ExtensionHackathonRequest {
    private String hackathonName;
    private String projectTitle;
    private String projectLink;

    public String getHackathonName() { return hackathonName; }
    public void setHackathonName(String hackathonName) { this.hackathonName = hackathonName; }
    public String getProjectTitle() { return projectTitle; }
    public void setProjectTitle(String projectTitle) { this.projectTitle = projectTitle; }
    public String getProjectLink() { return projectLink; }
    public void setProjectLink(String projectLink) { this.projectLink = projectLink; }
}
