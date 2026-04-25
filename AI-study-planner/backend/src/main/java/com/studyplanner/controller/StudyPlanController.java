package com.studyplanner.controller;
import com.studyplanner.service.AIQuizService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/studyplan")
@RequiredArgsConstructor
@Slf4j
public class StudyPlanController {
    private final AIQuizService aiQuizService;

    @PostMapping("/generate")
    public ResponseEntity<String> generate(@RequestBody Map<String,Object> body) {
        try {
            String prompt = (String) body.getOrDefault("prompt", "");
            if (prompt.isBlank()) return ResponseEntity.badRequest().body("{}");
            String result = aiQuizService.callAI(prompt);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Study plan generation failed: {}", e.getMessage());
            return ResponseEntity.status(503).body("{}");
        }
    }
}
