package com.studyplanner.model;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity @Table(name="materials") @Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Material {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    private Long userId;
    private String subjectName;
    private String fileName;
    private String fileType;
    private Long fileSize;
    private String fileUrl;
    private String cloudinaryPublicId;
    @Column(columnDefinition="TEXT") private String extractedText;
    @Column(columnDefinition="TEXT") private String aiSummary;
    @Enumerated(EnumType.STRING) @Builder.Default private ProcessingStatus status = ProcessingStatus.PROCESSING;
    @Builder.Default private LocalDateTime uploadedAt = LocalDateTime.now();
    public enum ProcessingStatus { PROCESSING, DONE, FAILED }
}
