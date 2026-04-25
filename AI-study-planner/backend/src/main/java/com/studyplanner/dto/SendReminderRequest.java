package com.studyplanner.dto;
import lombok.Data;
@Data public class SendReminderRequest {
    public String email;
    public String studentName;
    public String topic;
}