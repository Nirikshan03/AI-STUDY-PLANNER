package com.studyplanner.service;
import com.studyplanner.dto.LogScoreRequest;
import com.studyplanner.dto.LogSessionRequest;
import com.studyplanner.model.*;
import com.studyplanner.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
@Slf4j
public class AnalyticsService {
    private final StudySessionRepository sessionRepo;
    private final SubjectScoreRepository scoreRepo;
    private final AIQuizService aiQuizService;

    private final ConcurrentHashMap<Long, String>  recommendationCache = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<Long, Instant> recommendationTime  = new ConcurrentHashMap<>();
    private static final long CACHE_SECONDS = 1800; // 30 min

    public Map<String,Object> getDashboard(Long userId) {
        Integer totalMins   = sessionRepo.getTotalMinutes(userId);
        List<Object[]> bySubject  = scoreRepo.getAverageBySubject(userId);
        List<Object[]> weakTopics = scoreRepo.getWeakTopics(userId);
        List<StudySession> week   = sessionRepo.findByUserIdAndStudyDateBetween(
            userId, LocalDate.now().minusDays(7), LocalDate.now());

        double avgScore   = bySubject.stream().mapToDouble(r -> (Double) r[1]).average().orElse(0);
        double consistency = Math.min(week.size() / 7.0 * 100, 100);
        double readiness   = (avgScore * 0.6) + (consistency * 0.4);

        Map<String,Double> subjectScores = new LinkedHashMap<>();
        bySubject.forEach(r -> subjectScores.put((String) r[0], (Double) r[1]));

        List<String> weak = new ArrayList<>();
        weakTopics.stream().limit(3).forEach(r -> weak.add((String) r[0]));

        return Map.of(
            "totalStudyMinutes", totalMins != null ? totalMins : 0,
            "readinessScore",    Math.round(readiness),
            "subjectScores",     subjectScores,
            "weakTopics",        weak,
            "studyDaysThisWeek", week.size(),
            "averageScore",      Math.round(avgScore)
        );
    }

    public List<Map<String,Object>> getWeeklyTrend(Long userId) {
        List<Map<String,Object>> trend = new ArrayList<>();
        for (int i = 6; i >= 0; i--) {
            LocalDate date     = LocalDate.now().minusDays(i);
            List<StudySession> sessions = sessionRepo.findByUserIdAndStudyDateBetween(userId, date, date);
            int mins = sessions.stream().mapToInt(StudySession::getDurationMinutes).sum();
            trend.add(Map.of(
                "date", date.toString(),
                "minutes", mins,
                "day", date.getDayOfWeek().toString().substring(0, 3)
            ));
        }
        return trend;
    }

   public StudySession logSession(LogSessionRequest req) {
    return sessionRepo.save(StudySession.builder()
        .userId(req.getUserId()).subject(req.getSubject())
        .topic(req.getTopic())
        .durationMinutes(req.getDurationMinutes() != null ? req.getDurationMinutes() : 0)
        .studyDate(LocalDate.now()).build());
}

public SubjectScore logScore(LogScoreRequest req) {
    return scoreRepo.save(SubjectScore.builder()
        .userId(req.getUserId()).subject(req.getSubject())
        .topic(req.getTopic() != null ? req.getTopic() : req.getSubject())
        .scorePercent(req.getScorePercent())
        .questionsAttempted(req.getQuestionsAttempted() != null ? req.getQuestionsAttempted() : 0)
        .recordedDate(LocalDate.now()).build());
}

    public String getAIRecommendation(Long userId) {
        Instant last = recommendationTime.get(userId);
        if (last != null && Instant.now().isBefore(last.plusSeconds(CACHE_SECONDS))) {
            return recommendationCache.get(userId);
        }
        try {
            Map<String,Object> stats = getDashboard(userId);
            Object weakTopics = stats.get("weakTopics");
            String prompt = String.format(
                "A student has readiness score %s%%, average quiz score %s%%, studied %s days this week. " +
                "Weak topics: %s. Give 3 specific, actionable study recommendations in plain text (no markdown).",
                stats.get("readinessScore"), stats.get("averageScore"),
                stats.get("studyDaysThisWeek"), weakTopics);
            String result = aiQuizService.callAI(prompt);
            recommendationCache.put(userId, result);
            recommendationTime.put(userId, Instant.now());
            return result;
        } catch (Exception e) {
            log.error("AI recommendation failed: {}", e.getMessage());
            return "Keep studying consistently and focus on your weak topics!";
        }
    }
}
