package com.studyplanner.dto;
import lombok.AllArgsConstructor;
import lombok.Data;
import java.time.LocalDate;
@Data @AllArgsConstructor public class AuthResponse {
    private String token;
    private Long userId;
    private String name;
    private String email;
    private LocalDate examDate;
    private Integer dailyStudyHours;
    private Integer streak;
    private String provider;
}