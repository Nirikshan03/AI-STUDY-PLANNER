package com.studyplanner.dto;
import lombok.Data;
@Data
public class GenerateQuizRequest {
    public Long userId;
    public String subject;
    public String topic;
    public String difficulty = "Medium";
    public Integer count = 5;
}
