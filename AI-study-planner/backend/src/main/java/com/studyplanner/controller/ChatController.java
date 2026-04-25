package com.studyplanner.controller;
import com.studyplanner.service.AIQuizService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {
    private final AIQuizService aiQuizService;

    @PostMapping("/ask")
    public ResponseEntity<Map<String,String>> ask(@RequestBody Map<String,Object> body) {
        String question = (String) body.getOrDefault("question", "");
        if (question == null || question.isBlank()) {
            return ResponseEntity.ok(Map.of("answer", "Please ask a question."));
        }
        String prompt = "You are a helpful AI study tutor. Answer this student question clearly and " +
            "concisely with examples where helpful. Format your answer in plain text without markdown symbols. " +
            "Question: " + question;
        String answer = aiQuizService.callAIChat(prompt);
        return ResponseEntity.ok(Map.of("answer", answer != null ? answer : "No response from AI."));
    }
}
