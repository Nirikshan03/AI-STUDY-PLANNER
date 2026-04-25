package com.studyplanner.dto;
import lombok.Data;
@Data public class JoinGroupRequest {
    public Long userId;
    public String userName;
    public String userEmail;
    public String inviteCode;
}