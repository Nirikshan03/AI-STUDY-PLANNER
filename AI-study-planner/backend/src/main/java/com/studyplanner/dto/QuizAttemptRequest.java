package com.studyplanner.dto;
import lombok.Data;
@Data public class QuizAttemptRequest {
    public Long userId;
    public Long quizId;
    public String subject;
    public int score;
    public int totalQuestions;
    public int timeTakenSeconds;
}