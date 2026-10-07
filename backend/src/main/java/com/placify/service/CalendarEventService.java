package com.placify.service;

import com.placify.dto.CalendarEventDTO;
import com.placify.entity.CalendarEvent;
import com.placify.repository.CalendarEventRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class CalendarEventService {

    private final CalendarEventRepository calendarEventRepository;

    public CalendarEventService(CalendarEventRepository calendarEventRepository) {
        this.calendarEventRepository = calendarEventRepository;
    }

    public List<CalendarEventDTO> getAllEvents(Long userId) {
        return calendarEventRepository.findByUserIdOrderByEventDateAsc(userId)
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    public List<CalendarEventDTO> getEventsInRange(Long userId, LocalDate from, LocalDate to) {
        return calendarEventRepository
                .findByUserIdAndEventDateBetweenOrderByEventDateAsc(userId, from, to)
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    public CalendarEventDTO getEventById(Long id, Long userId) {
        CalendarEvent event = calendarEventRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Event not found"));
        return toDTO(event);
    }

    @Transactional
    public CalendarEventDTO createEvent(CalendarEventDTO dto, Long userId) {
        CalendarEvent event = toEntity(dto);
        event.setUserId(userId);
        return toDTO(calendarEventRepository.save(event));
    }

    @Transactional
    public CalendarEventDTO updateEvent(Long id, CalendarEventDTO dto, Long userId) {
        CalendarEvent event = calendarEventRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Event not found"));
        event.setTitle(dto.getTitle());
        event.setDescription(dto.getDescription());
        event.setEventDate(dto.getEventDate());
        event.setType(dto.getType());
        event.setNotifyDaysBefore(dto.getNotifyDaysBefore());
        return toDTO(calendarEventRepository.save(event));
    }

    @Transactional
    public void deleteEvent(Long id, Long userId) {
        CalendarEvent event = calendarEventRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Event not found"));
        calendarEventRepository.delete(event);
    }

    // ── Mapping helpers ────────────────────────────────────────────────

    private CalendarEventDTO toDTO(CalendarEvent e) {
        CalendarEventDTO dto = new CalendarEventDTO();
        dto.setId(e.getId());
        dto.setUserId(e.getUserId());
        dto.setTitle(e.getTitle());
        dto.setDescription(e.getDescription());
        dto.setEventDate(e.getEventDate());
        dto.setType(e.getType());
        dto.setNotifyDaysBefore(e.getNotifyDaysBefore());
        dto.setCreatedAt(e.getCreatedAt());
        dto.setUpdatedAt(e.getUpdatedAt());
        return dto;
    }

    private CalendarEvent toEntity(CalendarEventDTO dto) {
        CalendarEvent e = new CalendarEvent();
        e.setTitle(dto.getTitle());
        e.setDescription(dto.getDescription());
        e.setEventDate(dto.getEventDate());
        e.setType(dto.getType());
        e.setNotifyDaysBefore(dto.getNotifyDaysBefore() > 0 ? dto.getNotifyDaysBefore() : 1);
        return e;
    }
}
