package com.studyplanner.dto;
import lombok.Data;
@Data public class LogSessionRequest {
    public Long userId;
    public String subject;
    public String topic;
    public Integer durationMinutes;
}