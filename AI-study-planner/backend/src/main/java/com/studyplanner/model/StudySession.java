package com.studyplanner.model;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity @Table(name="study_sessions") @Data @NoArgsConstructor @AllArgsConstructor @Builder
public class StudySession {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    private Long userId;
    private String subject;
    private String topic;
    private int durationMinutes;
    private LocalDate studyDate;
    @Builder.Default private LocalDateTime createdAt = LocalDateTime.now();
}
