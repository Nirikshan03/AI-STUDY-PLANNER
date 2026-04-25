package com.studyplanner.dto;
import lombok.Data;
import java.time.LocalDate;
@Data public class CreateChallengeRequest {
    public String title;
    public String description;
    public String subject;
    public int targetCount;
    public int xpReward;
    public LocalDate endDate;
}