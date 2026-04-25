package com.studyplanner.controller;
import com.studyplanner.dto.LogScoreRequest;
import com.studyplanner.dto.LogSessionRequest;
import com.studyplanner.model.StudySession;
import com.studyplanner.model.SubjectScore;
import com.studyplanner.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
public class AnalyticsController {
    private final AnalyticsService analyticsService;

    @GetMapping("/dashboard/{userId}")
    public ResponseEntity<Map<String,Object>> dashboard(@PathVariable Long userId) {
        return ResponseEntity.ok(analyticsService.getDashboard(userId));
    }

    @GetMapping("/trend/{userId}")
    public ResponseEntity<List<Map<String,Object>>> trend(@PathVariable Long userId) {
        return ResponseEntity.ok(analyticsService.getWeeklyTrend(userId));
    }

    @PostMapping("/session")
    public ResponseEntity<StudySession> logSession(@RequestBody LogSessionRequest req) {
        return ResponseEntity.ok(analyticsService.logSession(req));
    }

    @PostMapping("/score")
    public ResponseEntity<SubjectScore> logScore(@RequestBody LogScoreRequest req) {
        return ResponseEntity.ok(analyticsService.logScore(req));
    }

    @GetMapping("/recommendation/{userId}")
    public ResponseEntity<Map<String,String>> recommendation(@PathVariable Long userId) {
        String rec = analyticsService.getAIRecommendation(userId);
        return ResponseEntity.ok(Map.of("recommendation", rec));
    }
}
