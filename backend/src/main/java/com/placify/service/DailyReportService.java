package com.placify.service;

import com.placify.dto.DailyReportDTO;
import com.placify.entity.DailyReport;
import com.placify.exception.ResourceNotFoundException;
import com.placify.repository.DailyReportRepository;
import com.placify.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class DailyReportService {

    private final DailyReportRepository dailyReportRepository;
    private final UserRepository userRepository;

    public DailyReportService(DailyReportRepository dailyReportRepository,
                               UserRepository userRepository) {
        this.dailyReportRepository = dailyReportRepository;
        this.userRepository = userRepository;
    }

    public List<DailyReportDTO> getAllForUser(Long userId) {
        return dailyReportRepository.findAllByUserIdOrderByReportDateDesc(userId)
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    public DailyReportDTO submitReport(Long userId, DailyReportDTO dto) {
        // Upsert: one report per day per user
        DailyReport report = dailyReportRepository
                .findByUserIdAndReportDate(userId, dto.getReportDate())
                .orElse(new DailyReport());

        report.setUserId(userId);
        report.setReportDate(dto.getReportDate());
        report.setHoursStudied(dto.getHoursStudied() != null ? dto.getHoursStudied() : 0.0);
        report.setDsaQuestionsSolved(dto.getDsaQuestionsSolved() != null ? dto.getDsaQuestionsSolved() : 0);
        report.setTopicsLearned(dto.getTopicsLearned());
        report.setAptitudeQuestionsSolved(dto.getAptitudeQuestionsSolved() != null ? dto.getAptitudeQuestionsSolved() : 0);
        report.setVerbalPracticeDone(dto.getVerbalPracticeDone() != null ? dto.getVerbalPracticeDone() : false);
        report.setNotes(dto.getNotes());
        report.setProductivityRating(dto.getProductivityRating() != null ? dto.getProductivityRating() : 5);

        return toDTO(dailyReportRepository.save(report));
    }

    public List<DailyReportDTO> getAllForAdmin(Long filterUserId, LocalDate from, LocalDate to) {
        List<DailyReport> reports;
        if (filterUserId != null && from != null && to != null) {
            reports = dailyReportRepository
                    .findByUserIdAndReportDateBetweenOrderByReportDateDesc(filterUserId, from, to);
        } else if (filterUserId != null) {
            reports = dailyReportRepository.findAllByUserIdOrderByReportDateDesc(filterUserId);
        } else if (from != null && to != null) {
            reports = dailyReportRepository.findByReportDateBetweenOrderByReportDateDesc(from, to);
        } else {
            reports = dailyReportRepository.findAllByOrderByReportDateDesc();
        }

        return reports.stream().map(r -> {
            DailyReportDTO dto = toDTO(r);
            userRepository.findById(r.getUserId()).ifPresent(u -> {
                dto.setUserId(u.getId());
                dto.setUsername(u.getUsername());
            });
            return dto;
        }).collect(Collectors.toList());
    }

    public double getStudyHoursThisWeek(Long userId) {
        LocalDate end = LocalDate.now();
        LocalDate start = end.minusDays(6);
        Double hours = dailyReportRepository.sumHoursStudiedByUserIdAndDateRange(userId, start, end);
        return hours != null ? Math.round(hours * 10.0) / 10.0 : 0.0;
    }

    /**
     * Calculate study streak: consecutive days with at least one report, ending today.
     */
    public int getStudyStreak(Long userId) {
        List<LocalDate> dates = dailyReportRepository.findReportDatesByUserId(userId);
        if (dates.isEmpty()) return 0;

        int streak = 0;
        LocalDate expected = LocalDate.now();
        for (LocalDate date : dates) {
            if (date.equals(expected)) {
                streak++;
                expected = expected.minusDays(1);
            } else if (date.isBefore(expected)) {
                break;
            }
        }
        return streak;
    }

    private DailyReportDTO toDTO(DailyReport report) {
        DailyReportDTO dto = new DailyReportDTO();
        dto.setId(report.getId());
        dto.setReportDate(report.getReportDate());
        dto.setHoursStudied(report.getHoursStudied());
        dto.setDsaQuestionsSolved(report.getDsaQuestionsSolved());
        dto.setTopicsLearned(report.getTopicsLearned());
        dto.setAptitudeQuestionsSolved(report.getAptitudeQuestionsSolved());
        dto.setVerbalPracticeDone(report.getVerbalPracticeDone());
        dto.setNotes(report.getNotes());
        dto.setProductivityRating(report.getProductivityRating());
        dto.setCreatedAt(report.getCreatedAt());
        dto.setUserId(report.getUserId());
        return dto;
    }
}
