package com.placify.controller;

import com.placify.dto.DailyReportDTO;
import com.placify.service.DailyReportService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reports")
public class DailyReportController {

    private final DailyReportService dailyReportService;

    public DailyReportController(DailyReportService dailyReportService) {
        this.dailyReportService = dailyReportService;
    }

    @GetMapping
    public ResponseEntity<List<DailyReportDTO>> getMyReports(Authentication auth) {
        Long userId = (Long) auth.getCredentials();
        return ResponseEntity.ok(dailyReportService.getAllForUser(userId));
    }

    @PostMapping
    public ResponseEntity<DailyReportDTO> submitReport(@RequestBody DailyReportDTO dto,
                                                        Authentication auth) {
        Long userId = (Long) auth.getCredentials();
        return ResponseEntity.ok(dailyReportService.submitReport(userId, dto));
    }

    @GetMapping("/streak")
    public ResponseEntity<Map<String, Object>> getStreak(Authentication auth) {
        Long userId = (Long) auth.getCredentials();
        int streak = dailyReportService.getStudyStreak(userId);
        double weeklyHours = dailyReportService.getStudyHoursThisWeek(userId);
        return ResponseEntity.ok(Map.of("streak", streak, "weeklyStudyHours", weeklyHours));
    }

    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<DailyReportDTO>> getAllReports(
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(dailyReportService.getAllForAdmin(userId, from, to));
    }
}
