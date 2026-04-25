package com.studyplanner.controller;
import com.studyplanner.dto.*;
import com.studyplanner.model.*;
import com.studyplanner.repository.*;
import com.studyplanner.service.AIQuizService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/quiz")
@RequiredArgsConstructor
public class QuizController {
    private final AIQuizService aiQuizService;
    private final QuizRepository quizRepo;
    private final QuizAttemptRepository attemptRepo;

    @PostMapping("/generate")
    public ResponseEntity<?> generate(@RequestBody GenerateQuizRequest req) {
        try {
            Quiz quiz = aiQuizService.generateQuiz(req);
            return ResponseEntity.ok(quiz);
        } catch (RuntimeException e) {
            // Return 400 with a human-readable message instead of 500
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Quiz>> getUserQuizzes(@PathVariable Long userId) {
        return ResponseEntity.ok(quizRepo.findByUserIdOrderByCreatedAtDesc(userId));
    }

    @GetMapping("/{quizId}")
    public ResponseEntity<Quiz> getQuiz(@PathVariable Long quizId) {
        return quizRepo.findById(quizId).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/attempt")
    public ResponseEntity<QuizAttempt> submitAttempt(@RequestBody QuizAttemptRequest req) {
        QuizAttempt a = QuizAttempt.builder()
            .userId(req.getUserId()).quizId(req.getQuizId()).subject(req.getSubject())
            .score(req.getScore()).totalQuestions(req.getTotalQuestions())
            .timeTakenSeconds(req.getTimeTakenSeconds()).build();
        return ResponseEntity.ok(attemptRepo.save(a));
    }

    @GetMapping("/attempts/{userId}")
    public ResponseEntity<List<QuizAttempt>> getAttempts(@PathVariable Long userId) {
        return ResponseEntity.ok(attemptRepo.findByUserIdOrderByAttemptedAtDesc(userId));
    }

    @GetMapping("/stats/{userId}")
    public ResponseEntity<Map<String,Object>> getStats(@PathVariable Long userId) {
        List<QuizAttempt> attempts = attemptRepo.findByUserId(userId);
        double avg = attempts.stream()
            .mapToDouble(a -> (double) a.getScore() / a.getTotalQuestions() * 100)
            .average().orElse(0);
        return ResponseEntity.ok(Map.of(
            "totalAttempts",   attempts.size(),
            "averageScore",    Math.round(avg),
            "totalQuestions",  attempts.stream().mapToInt(QuizAttempt::getTotalQuestions).sum()
        ));
    }
}
