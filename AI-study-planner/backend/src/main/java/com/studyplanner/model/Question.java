package com.studyplanner.model;
import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.*;

@Entity @Table(name="questions") @Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Question {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="quiz_id")
    @JsonBackReference private Quiz quiz;
    @Column(columnDefinition="TEXT") private String questionText;
    private String optionA, optionB, optionC, optionD, correctAnswer;
    @Column(columnDefinition="TEXT") private String explanation;
}
