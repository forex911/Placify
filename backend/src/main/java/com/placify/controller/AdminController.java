package com.placify.controller;

import com.placify.dto.DailyReportDTO;
import com.placify.dto.SubjectProgressDTO;
import com.placify.entity.User;
import com.placify.repository.*;
import com.placify.service.DailyReportService;
import com.placify.service.SubjectProgressService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

// test git
@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final UserRepository userRepository;
    private final ApplicationRepository applicationRepository;
    private final DsaTrackerRepository dsaTrackerRepository;
    private final StudyTaskRepository studyTaskRepository;
    private final NoteRepository noteRepository;
    private final DailyReportRepository dailyReportRepository;
    private final DailyReportService dailyReportService;
    private final SubjectProgressService subjectProgressService;

    public AdminController(UserRepository userRepository,
            ApplicationRepository applicationRepository,
            DsaTrackerRepository dsaTrackerRepository,
            StudyTaskRepository studyTaskRepository,
            NoteRepository noteRepository,
            DailyReportRepository dailyReportRepository,
            DailyReportService dailyReportService,
            SubjectProgressService subjectProgressService) {
        this.userRepository = userRepository;
        this.applicationRepository = applicationRepository;
        this.dsaTrackerRepository = dsaTrackerRepository;
        this.studyTaskRepository = studyTaskRepository;
        this.noteRepository = noteRepository;
        this.dailyReportRepository = dailyReportRepository;
        this.dailyReportService = dailyReportService;
        this.subjectProgressService = subjectProgressService;
    }

    /** GET /api/admin/users â€” all users with stats */
    @GetMapping("/users")
    public ResponseEntity<List<Map<String, Object>>> getAllUsers() {
        List<User> users = userRepository.findAllOrderByCreatedAtDesc();
        List<Map<String, Object>> result = users.stream().map(user -> {
            long appCount = applicationRepository.countByUserId(user.getId());
            long dsaCount = dsaTrackerRepository.countByUserId(user.getId());
            long taskCount = studyTaskRepository.countByUserId(user.getId());
            long noteCount = noteRepository.countByUserId(user.getId());
            long reportCount = dailyReportRepository.countByUserId(user.getId());

            Map<String, Object> m = new HashMap<>();
            m.put("id", user.getId());
            m.put("username", user.getUsername());
            m.put("fullName", user.getFullName());
            m.put("email", user.getEmail());
            m.put("role", user.getRole().name());
            m.put("enabled", user.isEnabled());
            m.put("lastLogin", user.getLastLogin() != null ? user.getLastLogin().toString() : null);
            m.put("createdAt", user.getCreatedAt() != null ? user.getCreatedAt().toString() : "");
            m.put("applicationCount", appCount);
            m.put("dsaTopicCount", dsaCount);
            m.put("taskCount", taskCount);
            m.put("noteCount", noteCount);
            m.put("reportCount", reportCount);
            return m;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    /** GET /api/admin/stats â€” system-wide statistics */
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getSystemStats() {
        long totalUsers = userRepository.count();
        long activeUsers = userRepository.countByEnabled(true);
        long totalApplications = applicationRepository.count();
        long totalDsaTopics = dsaTrackerRepository.count();
        long totalTasks = studyTaskRepository.count();
        long totalNotes = noteRepository.count();
        long totalReports = dailyReportRepository.count();

        Double avgDsaProgress = dsaTrackerRepository.findAverageProgress();
        Long totalSolvedQuestions = dsaTrackerRepository.sumAllSolvedQuestions();

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalUsers", totalUsers);
        stats.put("activeUsers", activeUsers);
        stats.put("inactiveUsers", totalUsers - activeUsers);
        stats.put("totalApplications", totalApplications);
        stats.put("totalDsaTopics", totalDsaTopics);
        stats.put("totalTasks", totalTasks);
        stats.put("totalNotes", totalNotes);
        stats.put("totalDailyReports", totalReports);
        stats.put("averageDsaProgress", avgDsaProgress != null ? Math.round(avgDsaProgress * 10.0) / 10.0 : 0.0);
        stats.put("totalDsaQuestionsSolved", totalSolvedQuestions != null ? totalSolvedQuestions : 0);
        return ResponseEntity.ok(stats);
    }

    /** GET /api/admin/analytics â€” advanced analytics */
    @GetMapping("/analytics")
    public ResponseEntity<Map<String, Object>> getAnalytics() {
        List<User> users = userRepository.findAll();
        List<Map<String, Object>> userActivity = users.stream().map(u -> {
            Map<String, Object> m = new HashMap<>();
            m.put("userId", u.getId());
            m.put("username", u.getUsername());
            m.put("reportCount", dailyReportRepository.countByUserId(u.getId()));
            m.put("dsaTopics", dsaTrackerRepository.countByUserId(u.getId()));
            m.put("applications", applicationRepository.countByUserId(u.getId()));
            m.put("lastLogin", u.getLastLogin() != null ? u.getLastLogin().toString() : null);
            m.put("enabled", u.isEnabled());
            return m;
        }).collect(Collectors.toList());

        // Sort by report count descending (most active first)
        userActivity.sort((a, b) -> Long.compare(
                (Long) b.get("reportCount"), (Long) a.get("reportCount")));

        Map<String, Object> analytics = new HashMap<>();
        analytics.put("userActivity", userActivity);
        analytics.put("totalUsers", users.size());
        analytics.put("activeUsers", users.stream().filter(User::isEnabled).count());

        return ResponseEntity.ok(analytics);
    }

    /** GET /api/admin/reports â€” all daily reports */
    @GetMapping("/reports")
    public ResponseEntity<List<DailyReportDTO>> getAllReports(
            @RequestParam(required = false) Long userId) {
        return ResponseEntity.ok(dailyReportService.getAllForAdmin(userId, null, null));
    }

    /** GET /api/admin/subjects â€” all users' subject progress */
    @GetMapping("/subjects")
    public ResponseEntity<List<SubjectProgressDTO>> getAllSubjectProgress() {
        return ResponseEntity.ok(subjectProgressService.getAllForAdmin());
    }

    /** PUT /api/admin/users/{id}/enable */
    @PutMapping("/users/{id}/enable")
    public ResponseEntity<?> enableUser(@PathVariable Long id) {
        return userRepository.findById(id).map(user -> {
            user.setEnabled(true);
            userRepository.save(user);
            return ResponseEntity.ok(Map.of("message", "User enabled", "userId", id));
        }).orElse(ResponseEntity.notFound().build());
    }

    /** PUT /api/admin/users/{id}/disable */
    @PutMapping("/users/{id}/disable")
    public ResponseEntity<?> disableUser(@PathVariable Long id) {
        return userRepository.findById(id).map(user -> {
            if (user.getRole() == User.Role.ADMIN) {
                return ResponseEntity.badRequest().body(
                        Map.of("message", "Cannot disable an admin user"));
            }
            user.setEnabled(false);
            userRepository.save(user);
            return ResponseEntity.ok(Map.of("message", "User disabled", "userId", id));
        }).orElse(ResponseEntity.notFound().build());
    }

    /** DELETE /api/admin/users/{id} */
    @DeleteMapping("/users/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        if (!userRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        userRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    /** GET /api/admin/applications â€” all applications */
    @GetMapping("/applications")
    public ResponseEntity<?> getAllApplications() {
        return ResponseEntity.ok(applicationRepository.findAll());
    }

    /** GET /api/admin/dsa â€” all DSA progress */
    @GetMapping("/dsa")
    public ResponseEntity<?> getAllDsaProgress() {
        return ResponseEntity.ok(dsaTrackerRepository.findAll());
    }
}