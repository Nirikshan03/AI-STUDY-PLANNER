package com.studyplanner.model;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Entity @Table(name="quizzes") @Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Quiz {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    private Long userId;
    private String title;
    private String subject;
    private String topic;
    @Enumerated(EnumType.STRING) @Builder.Default private Difficulty difficulty = Difficulty.MEDIUM;
    @OneToMany(mappedBy="quiz", cascade=CascadeType.ALL, fetch=FetchType.EAGER)
    @JsonManagedReference private List<Question> questions;
    @Builder.Default private LocalDateTime createdAt = LocalDateTime.now();
    public enum Difficulty { EASY, MEDIUM, HARD }
}
