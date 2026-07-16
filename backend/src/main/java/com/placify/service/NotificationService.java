package com.placify.service;

import com.placify.dto.NotificationDTO;
import com.placify.entity.Notification;
import com.placify.entity.Notification.NotificationType;
import com.placify.repository.ApplicationRepository;
import com.placify.repository.DailyReportRepository;
import com.placify.repository.NotificationRepository;
import com.placify.repository.StudyTaskRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final ApplicationRepository applicationRepository;
    private final DailyReportRepository dailyReportRepository;
    private final StudyTaskRepository studyTaskRepository;

    public NotificationService(NotificationRepository notificationRepository,
                                ApplicationRepository applicationRepository,
                                DailyReportRepository dailyReportRepository,
                                StudyTaskRepository studyTaskRepository) {
        this.notificationRepository = notificationRepository;
        this.applicationRepository = applicationRepository;
        this.dailyReportRepository = dailyReportRepository;
        this.studyTaskRepository = studyTaskRepository;
    }

    public List<NotificationDTO> getUnreadForUser(Long userId) {
        return notificationRepository.findByUserIdAndIsReadFalseOrderByCreatedAtDesc(userId)
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    public long getUnreadCount(Long userId) {
        return notificationRepository.countByUserIdAndIsReadFalse(userId);
    }

    @Transactional
    public void markAsRead(Long id, Long userId) {
        notificationRepository.findById(id).ifPresent(n -> {
            if (n.getUserId().equals(userId)) {
                n.setRead(true);
                notificationRepository.save(n);
            }
        });
    }

    @Transactional
    public void markAllAsRead(Long userId) {
        notificationRepository.findByUserIdAndIsReadFalseOrderByCreatedAtDesc(userId)
                .forEach(n -> {
                    n.setRead(true);
                    notificationRepository.save(n);
                });
    }

    /**
     * Generate notifications for upcoming deadlines, pending tasks, and daily report reminder.
     */
    @Transactional
    public int generateNotifications(Long userId) {
        int generated = 0;

        // 1. Upcoming deadlines (next 3 days)
        var upcomingApps = applicationRepository.findByUserIdAndDeadlineBetween(
                userId, LocalDate.now(), LocalDate.now().plusDays(3));
        for (var app : upcomingApps) {
            String msg = "â° Deadline approaching for " + app.getCompanyName()
                    + " (" + app.getRole() + ") â€” " + app.getDeadline();
            Notification n = new Notification(userId, msg, NotificationType.DEADLINE);
            notificationRepository.save(n);
            generated++;
        }

        // 2. Daily report reminder (if no report today)
        boolean reportedToday = dailyReportRepository
                .findByUserIdAndReportDate(userId, LocalDate.now()).isPresent();
        if (!reportedToday) {
            Notification n = new Notification(userId,
                    "ðŸ“ Don't forget to submit your daily study report for today!",
                    NotificationType.DAILY_REPORT);
            notificationRepository.save(n);
            generated++;
        }

        // 3. Pending tasks reminder
        long pendingCount = studyTaskRepository.countByUserIdAndStatus(
                userId, com.placify.entity.StudyTask.TaskStatus.Pending);
        if (pendingCount > 3) {
            Notification n = new Notification(userId,
                    "âœ… You have " + pendingCount + " pending study tasks. Keep going!",
                    NotificationType.PENDING_TASK);
            notificationRepository.save(n);
            generated++;
        }

        return generated;
    }

    private NotificationDTO toDTO(Notification n) {
        return new NotificationDTO(n.getId(), n.getUserId(), n.getMessage(),
                n.getType(), n.isRead(), n.getCreatedAt());
    }
}
