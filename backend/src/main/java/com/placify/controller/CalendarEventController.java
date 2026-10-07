package com.placify.controller;

import com.placify.dto.CalendarEventDTO;
import com.placify.service.CalendarEventService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/calendar")
public class CalendarEventController {

    private final CalendarEventService calendarEventService;

    public CalendarEventController(CalendarEventService calendarEventService) {
        this.calendarEventService = calendarEventService;
    }

    private Long getUserId(Authentication auth) {
        return (Long) auth.getCredentials();
    }

    /** GET /api/calendar — all events for user, ordered by date */
    @GetMapping
    public ResponseEntity<List<CalendarEventDTO>> getAllEvents(Authentication auth) {
        return ResponseEntity.ok(calendarEventService.getAllEvents(getUserId(auth)));
    }

    /** GET /api/calendar/range?from=2026-10-01&to=2026-10-31 */
    @GetMapping("/range")
    public ResponseEntity<List<CalendarEventDTO>> getEventsInRange(
            Authentication auth,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(calendarEventService.getEventsInRange(getUserId(auth), from, to));
    }

    /** GET /api/calendar/{id} */
    @GetMapping("/{id}")
    public ResponseEntity<CalendarEventDTO> getEventById(
            @PathVariable Long id, Authentication auth) {
        return ResponseEntity.ok(calendarEventService.getEventById(id, getUserId(auth)));
    }

    /** POST /api/calendar */
    @PostMapping
    public ResponseEntity<CalendarEventDTO> createEvent(
            @Valid @RequestBody CalendarEventDTO dto, Authentication auth) {
        CalendarEventDTO created = calendarEventService.createEvent(dto, getUserId(auth));
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /** PUT /api/calendar/{id} */
    @PutMapping("/{id}")
    public ResponseEntity<CalendarEventDTO> updateEvent(
            @PathVariable Long id,
            @Valid @RequestBody CalendarEventDTO dto,
            Authentication auth) {
        return ResponseEntity.ok(calendarEventService.updateEvent(id, dto, getUserId(auth)));
    }

    /** DELETE /api/calendar/{id} */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteEvent(
            @PathVariable Long id, Authentication auth) {
        calendarEventService.deleteEvent(id, getUserId(auth));
        return ResponseEntity.noContent().build();
    }
}
