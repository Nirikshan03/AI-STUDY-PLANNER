package com.studyplanner.dto;
import jakarta.validation.constraints.*;
import lombok.Data;
import java.time.LocalDate;
@Data public class RegisterRequest {
    @NotBlank public String name;
    @Email @NotBlank public String email;
    @NotBlank @Size(min=6) public String password;
    public LocalDate examDate;
    public Integer dailyStudyHours;
}