package com.studyplanner.model;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity @Table(name="group_challenges") @Data @NoArgsConstructor @AllArgsConstructor @Builder
public class GroupChallenge {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    private Long groupId;
    private String title;
    @Column(columnDefinition="TEXT") private String description;
    private String subject;
    private int targetCount;
    private int xpReward;
    private LocalDate endDate;
}
