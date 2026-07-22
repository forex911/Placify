package com.placify.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class HealthController {

    @RequestMapping(value = {"/api/health", "/"}, method = {RequestMethod.GET, RequestMethod.HEAD})
    public ResponseEntity<?> checkHealth() {
        return ResponseEntity.ok(Map.of(
            "status", "UP",
            "message", "Placify Backend is running and connected",
            "timestamp", System.currentTimeMillis()
        ));
    }
}
