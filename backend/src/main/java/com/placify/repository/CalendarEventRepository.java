package com.placify.repository;

import com.placify.entity.CalendarEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface CalendarEventRepository extends JpaRepository<CalendarEvent, Long> {

    List<CalendarEvent> findByUserIdOrderByEventDateAsc(Long userId);

    List<CalendarEvent> findByUserIdAndEventDateBetweenOrderByEventDateAsc(
            Long userId, LocalDate from, LocalDate to);

    Optional<CalendarEvent> findByIdAndUserId(Long id, Long userId);

    // Events whose notify window starts today: eventDate - notifyDaysBefore == today
    List<CalendarEvent> findByEventDateBetween(LocalDate from, LocalDate to);
}
