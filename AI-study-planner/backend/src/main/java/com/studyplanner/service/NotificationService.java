package com.studyplanner.service;

import com.studyplanner.model.User;
import com.studyplanner.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {
    private final JavaMailSender mailSender;
    private final UserRepository userRepository;  // ADD THIS

    public void sendStudyReminder(String toEmail, String studentName, String topic) {
        try {
            SimpleMailMessage msg = new SimpleMailMessage();
            msg.setTo(toEmail);
            msg.setSubject("StudyAI - Time to Study: " + topic);
            msg.setText("Hi " + studentName + "!\n\nTime for your scheduled session: " + topic +
                "\n\nOpen StudyAI and generate a quiz!\n\n- StudyAI Team");
            mailSender.send(msg);
            log.info("Reminder sent to {}", toEmail);
        } catch (Exception e) {
            log.error("Email failed to {}: {}", toEmail, e.getMessage());
        }
    }

    // ADD THIS — sends daily reminder to all users at 8am
    @Scheduled(cron = "0 25 12 * * *", zone = "Asia/Kolkata")
    public void sendDailyReminders() {
        log.info("Daily reminder job running...");
        List<User> users = userRepository.findAll();
        for (User user : users) {
            if (user.getEmail() != null) {
                sendStudyReminder(
                    user.getEmail(),
                    user.getName() != null ? user.getName() : "Student",
                    "your daily study session"
                );
            }
        }
        log.info("Daily reminders sent to {} users", users.size());
    }
}