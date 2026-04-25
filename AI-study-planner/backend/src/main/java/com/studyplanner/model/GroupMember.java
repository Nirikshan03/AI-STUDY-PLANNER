package com.studyplanner.model;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity @Table(name="group_members") @Data @NoArgsConstructor @AllArgsConstructor @Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class GroupMember {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @ManyToOne(fetch=FetchType.EAGER) @JoinColumn(name="group_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private StudyGroup group;
    private Long userId;
    private String userName;
    private String userEmail;
    @Builder.Default private Integer xpScore = 0;
    @Builder.Default private Integer quizzesCompleted = 0;
    @Builder.Default private LocalDateTime joinedAt = LocalDateTime.now();
}
