package com.studyplanner.dto;
import lombok.Data;
@Data public class CreateGroupRequest {
    public Long userId;
    public String userName;
    public String userEmail;
    public String name;
    public String subjectFocus;
}