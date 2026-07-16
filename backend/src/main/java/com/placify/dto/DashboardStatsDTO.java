package com.placify.dto;

import java.util.List;

public class DashboardStatsDTO {

    // Existing
    private long totalApplications;
    private long upcomingDeadlines;
    private long pendingStudyTasks;
    private double averageDsaProgress;
    private long selectedApplications;
    private long rejectedApplications;
    private long interviewApplications;

    // New
    private long totalHackathons;
    private double totalStudyHoursThisWeek;
    private int studyStreak; // consecutive days with a report
    private int dsaTopicsSolved; // topics at 100%
    private long totalDsaQuestionsSolved;
    private List<SubjectProgressDTO> subjectProgress;
    private long unreadNotifications;

    public DashboardStatsDTO() {}

    // â”€â”€ Full constructor â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    public DashboardStatsDTO(long totalApplications, long upcomingDeadlines, long pendingStudyTasks,
                              double averageDsaProgress, long selectedApplications,
                              long rejectedApplications, long interviewApplications) {
        this.totalApplications = totalApplications;
        this.upcomingDeadlines = upcomingDeadlines;
        this.pendingStudyTasks = pendingStudyTasks;
        this.averageDsaProgress = averageDsaProgress;
        this.selectedApplications = selectedApplications;
        this.rejectedApplications = rejectedApplications;
        this.interviewApplications = interviewApplications;
    }

    // â”€â”€ Getters & Setters â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    public long getTotalApplications() { return totalApplications; }
    public void setTotalApplications(long totalApplications) { this.totalApplications = totalApplications; }

    public long getUpcomingDeadlines() { return upcomingDeadlines; }
    public void setUpcomingDeadlines(long upcomingDeadlines) { this.upcomingDeadlines = upcomingDeadlines; }

    public long getPendingStudyTasks() { return pendingStudyTasks; }
    public void setPendingStudyTasks(long pendingStudyTasks) { this.pendingStudyTasks = pendingStudyTasks; }

    public double getAverageDsaProgress() { return averageDsaProgress; }
    public void setAverageDsaProgress(double averageDsaProgress) { this.averageDsaProgress = averageDsaProgress; }

    public long getSelectedApplications() { return selectedApplications; }
    public void setSelectedApplications(long selectedApplications) { this.selectedApplications = selectedApplications; }

    public long getRejectedApplications() { return rejectedApplications; }
    public void setRejectedApplications(long rejectedApplications) { this.rejectedApplications = rejectedApplications; }

    public long getInterviewApplications() { return interviewApplications; }
    public void setInterviewApplications(long interviewApplications) { this.interviewApplications = interviewApplications; }

    public long getTotalHackathons() { return totalHackathons; }
    public void setTotalHackathons(long totalHackathons) { this.totalHackathons = totalHackathons; }

    public double getTotalStudyHoursThisWeek() { return totalStudyHoursThisWeek; }
    public void setTotalStudyHoursThisWeek(double totalStudyHoursThisWeek) { this.totalStudyHoursThisWeek = totalStudyHoursThisWeek; }

    public int getStudyStreak() { return studyStreak; }
    public void setStudyStreak(int studyStreak) { this.studyStreak = studyStreak; }

    public int getDsaTopicsSolved() { return dsaTopicsSolved; }
    public void setDsaTopicsSolved(int dsaTopicsSolved) { this.dsaTopicsSolved = dsaTopicsSolved; }

    public long getTotalDsaQuestionsSolved() { return totalDsaQuestionsSolved; }
    public void setTotalDsaQuestionsSolved(long totalDsaQuestionsSolved) { this.totalDsaQuestionsSolved = totalDsaQuestionsSolved; }

    public List<SubjectProgressDTO> getSubjectProgress() { return subjectProgress; }
    public void setSubjectProgress(List<SubjectProgressDTO> subjectProgress) { this.subjectProgress = subjectProgress; }

    public long getUnreadNotifications() { return unreadNotifications; }
    public void setUnreadNotifications(long unreadNotifications) { this.unreadNotifications = unreadNotifications; }
}
