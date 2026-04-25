package com.studyplanner.model;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity @Table(name="users") @Data @NoArgsConstructor @AllArgsConstructor @Builder
public class User {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @Column(nullable=false) private String name;
    @Column(unique=true, nullable=false) private String email;
    private String password;
    private LocalDate examDate;
    @Builder.Default private Integer dailyStudyHours = 4;
    @Builder.Default private Integer streak = 0;
    @Builder.Default private Integer totalXp = 0;
    @Builder.Default private String provider = "LOCAL";
    @Enumerated(EnumType.STRING) @Builder.Default private Role role = Role.STUDENT;
    @Builder.Default private LocalDateTime createdAt = LocalDateTime.now();
    public enum Role { STUDENT, ADMIN }
}
