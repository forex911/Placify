package com.placify.controller;

import com.placify.dto.DashboardStatsDTO;
import com.placify.entity.Application.ApplicationStatus;
import com.placify.entity.StudyTask.TaskStatus;
import com.placify.repository.ApplicationRepository;
import com.placify.repository.HackathonRepository;
import com.placify.repository.NotificationRepository;
import com.placify.repository.StudyTaskRepository;
import com.placify.service.DsaTrackerService;
import com.placify.service.SubjectProgressService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final ApplicationRepository applicationRepository;
    private final StudyTaskRepository studyTaskRepository;
    private final DsaTrackerService dsaTrackerService;
    private final SubjectProgressService subjectProgressService;
    private final NotificationRepository notificationRepository;
    private final HackathonRepository hackathonRepository;

    public DashboardController(ApplicationRepository applicationRepository,
                                StudyTaskRepository studyTaskRepository,
                                DsaTrackerService dsaTrackerService,
                                SubjectProgressService subjectProgressService,
                                NotificationRepository notificationRepository,
                                HackathonRepository hackathonRepository) {
        this.applicationRepository = applicationRepository;
        this.studyTaskRepository = studyTaskRepository;
        this.dsaTrackerService = dsaTrackerService;
        this.subjectProgressService = subjectProgressService;
        this.notificationRepository = notificationRepository;
        this.hackathonRepository = hackathonRepository;
    }

    @GetMapping("/stats")
    public ResponseEntity<DashboardStatsDTO> getDashboardStats(Authentication auth) {
        Long userId = (Long) auth.getCredentials();

        long totalApplications = applicationRepository.countByUserId(userId);
        long upcomingDeadlines = applicationRepository
                .findByUserIdAndDeadlineBetween(userId, LocalDate.now(), LocalDate.now().plusDays(7)).size();
        long pendingStudyTasks = studyTaskRepository.countByUserIdAndStatus(userId, TaskStatus.Pending);
        double avgDsaProgress = dsaTrackerService.getAverageProgressByUser(userId);
        long selectedApplications = applicationRepository.countByUserIdAndStatus(userId, ApplicationStatus.Selected);
        long rejectedApplications = applicationRepository.countByUserIdAndStatus(userId, ApplicationStatus.Rejected);
        long interviewApplications = applicationRepository.countByUserIdAndStatus(userId, ApplicationStatus.Interview_Scheduled);
        long totalHackathons = hackathonRepository.countByUserId(userId);
        int completedTopics = (int) dsaTrackerService.getCompletedTopicsCountByUser(userId);
        long totalSolved = dsaTrackerService.getTotalSolvedByUser(userId);
        long unread = notificationRepository.countByUserIdAndIsReadFalse(userId);

        DashboardStatsDTO stats = new DashboardStatsDTO(
                totalApplications, upcomingDeadlines, pendingStudyTasks,
                avgDsaProgress, selectedApplications, rejectedApplications, interviewApplications);

        stats.setTotalHackathons(totalHackathons);
        stats.setTotalStudyHoursThisWeek(0); // placeholder if needed later
        stats.setStudyStreak(0);
        stats.setDsaTopicsSolved(completedTopics);
        stats.setTotalDsaQuestionsSolved(totalSolved);
        stats.setSubjectProgress(subjectProgressService.getAllForUser(userId));
        stats.setUnreadNotifications(unread);

        return ResponseEntity.ok(stats);
    }
}
