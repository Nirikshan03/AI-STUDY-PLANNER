package com.studyplanner.controller;
import com.studyplanner.dto.SendReminderRequest;
import com.studyplanner.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {
    private final NotificationService notificationService;

    @PostMapping("/reminder")
    public ResponseEntity<String> sendReminder(@RequestBody SendReminderRequest req) {
        notificationService.sendStudyReminder(req.getEmail(), req.getStudentName(), req.getTopic());
        return ResponseEntity.ok("Reminder sent");
    }
}