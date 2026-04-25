package com.studyplanner.dto;
import lombok.Data;
@Data public class LogScoreRequest {
    public Long userId;
    public String subject;
    public String topic;
    public double scorePercent;
    public Integer questionsAttempted;
}