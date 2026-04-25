package com.studyplanner.model;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity @Table(name="study_groups") @Data @NoArgsConstructor @AllArgsConstructor @Builder
public class StudyGroup {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    private String name;
    private String subjectFocus;
    private Long createdByUserId;
    @Column(unique=true) private String inviteCode;
    @Builder.Default private LocalDateTime createdAt = LocalDateTime.now();
}
