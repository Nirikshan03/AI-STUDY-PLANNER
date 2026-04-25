package com.studyplanner.model;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity @Table(name="quiz_attempts") @Data @NoArgsConstructor @AllArgsConstructor @Builder
public class QuizAttempt {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    private Long userId;
    private Long quizId;
    private String subject;
    private int score;
    private int totalQuestions;
    private int timeTakenSeconds;
    @Builder.Default private LocalDateTime attemptedAt = LocalDateTime.now();
}
