package com.studyplanner.model;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity @Table(name="subject_scores") @Data @NoArgsConstructor @AllArgsConstructor @Builder
public class SubjectScore {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    private Long userId;
    private String subject;
    private String topic;
    private double scorePercent;
    private int questionsAttempted;
    private LocalDate recordedDate;
}
