package com.studyplanner.service;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.studyplanner.dto.GenerateQuizRequest;
import com.studyplanner.model.*;
import com.studyplanner.repository.QuizRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import java.io.*;
import java.net.*;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
@Slf4j
public class AIQuizService {
    private final QuizRepository quizRepository;
    private final ObjectMapper objectMapper;

    @Value("${groq.api.key:}") private String groqApiKey;

    // Groq uses OpenAI-compatible API — completely free tier
    private static final String GROQ_URL   = "https://api.groq.com/openai/v1/chat/completions";
    private static final String GROQ_MODEL = "llama-3.3-70b-versatile"; // free, fast, capable

    private final ConcurrentHashMap<String, String> chatCache = new ConcurrentHashMap<>();

    // ── Quiz Generation ──────────────────────────────────────────────────────

    public Quiz generateQuiz(GenerateQuizRequest req) {
        if (req.getCount() == null || req.getCount() < 1) req.setCount(5);
        if (req.getCount() > 15) req.setCount(15);

        String topicPart = (req.getTopic() != null && !req.getTopic().isBlank())
            ? " specifically about " + req.getTopic() : "";
        String prompt = String.format(
            "Generate %d multiple choice questions about %s%s at %s difficulty level. " +
            "Return ONLY a raw JSON array, no markdown, no extra text. " +
            "Each object must have: question, optionA, optionB, optionC, optionD, correctAnswer (A/B/C/D only), explanation.",
            req.getCount(), req.getSubject(), topicPart, req.getDifficulty());

        List<Question> questions;
        try {
            String aiResponse = callGroqAPI(prompt);
            questions = parseQuestions(aiResponse);
        } catch (Exception e) {
            log.error("Quiz generation failed: {}", e.getMessage());
            throw new RuntimeException(e.getMessage());
        }

        if (questions.isEmpty()) {
            questions = generateFallbackQuestions(req);
        }

        String title = req.getSubject()
            + (req.getTopic() != null && !req.getTopic().isBlank() ? " - " + req.getTopic() : "")
            + " (" + req.getDifficulty() + ")";

        Quiz quiz = Quiz.builder()
            .userId(req.getUserId()).title(title)
            .subject(req.getSubject()).topic(req.getTopic())
            .difficulty(Quiz.Difficulty.valueOf(req.getDifficulty().toUpperCase()))
            .questions(questions).build();

        Quiz saved = quizRepository.save(quiz);
        questions.forEach(q -> q.setQuiz(saved));
        return saved;
    }

    // ── Public callers (all route to Groq) ──────────────────────────────────

    public String callAIChat(String prompt) {
        if (!isApiKeySet())
            return "AI tutor not configured. Add GROQ_API_KEY to .env and restart.";
        String cacheKey = String.valueOf(prompt.hashCode());
        if (chatCache.containsKey(cacheKey)) return chatCache.get(cacheKey);
        try {
            String result = callGroqAPI(prompt);
            chatCache.put(cacheKey, result);
            return result;
        } catch (Exception e) {
            log.error("Groq chat failed: {}", e.getMessage());
            return "Error: " + e.getMessage();
        }
    }

    public String callAISummary(String prompt) {
        if (!isApiKeySet()) return "Add GROQ_API_KEY to .env to enable summaries.";
        try { return callGroqAPI(prompt); }
        catch (Exception e) {
            log.error("Groq summary failed: {}", e.getMessage());
            return "Summary unavailable: " + e.getMessage();
        }
    }

    public String callAI(String prompt) {
        if (!isApiKeySet()) return "Keep studying consistently and focus on your weak topics!";
        try { return callGroqAPI(prompt); }
        catch (Exception e) {
            log.error("Groq recommendation failed: {}", e.getMessage());
            return "Keep studying consistently! (" + e.getMessage() + ")";
        }
    }

    // ── Core HTTP call to Groq (OpenAI-compatible) ───────────────────────────

    private String callGroqAPI(String prompt) throws Exception {
        if (!isApiKeySet()) throw new RuntimeException("GROQ_API_KEY not set in .env");

        ObjectMapper mapper = new ObjectMapper();

        Map<String, String> message = new LinkedHashMap<>();
        message.put("role", "user");
        message.put("content", prompt);

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("model", GROQ_MODEL);
        body.put("max_tokens", 4096);
        body.put("temperature", 0.7);
        body.put("messages", List.of(message));

        String jsonBody = mapper.writeValueAsString(body);

        URL url = new URL(GROQ_URL);
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        conn.setRequestMethod("POST");
        conn.setRequestProperty("Content-Type", "application/json");
        conn.setRequestProperty("Authorization", "Bearer " + groqApiKey.trim());
        conn.setDoOutput(true);
        conn.setConnectTimeout(15000);
        conn.setReadTimeout(60000);

        try (OutputStream os = conn.getOutputStream()) {
            os.write(jsonBody.getBytes(StandardCharsets.UTF_8));
        }

        int statusCode = conn.getResponseCode();
        log.info("Groq HTTP status: {}", statusCode);

        InputStream is = (statusCode == 200) ? conn.getInputStream() : conn.getErrorStream();
        String responseBody = new String(is.readAllBytes(), StandardCharsets.UTF_8);
        conn.disconnect();

        log.info("Groq raw response (first 300 chars): {}",
            responseBody.substring(0, Math.min(300, responseBody.length())));

        if (statusCode == 429) throw new RuntimeException("Groq rate limit hit (429). Retry shortly.");
        if (statusCode == 401) throw new RuntimeException("Groq API key invalid (401). Check GROQ_API_KEY.");
        if (statusCode == 400) throw new RuntimeException("Groq bad request (400): " + responseBody);
        if (statusCode != 200) throw new RuntimeException("Groq error " + statusCode + ": " + responseBody);

        // OpenAI-compatible response: choices[0].message.content
        JsonNode root = objectMapper.readTree(responseBody);
        if (root.has("error")) {
            throw new RuntimeException("Groq API error: " + root.path("error").path("message").asText());
        }

        JsonNode choices = root.path("choices");
        if (!choices.isArray() || choices.isEmpty()) {
            log.warn("Groq returned no choices. Full response: {}", responseBody);
            throw new RuntimeException("Groq returned empty response. Check API key and try again.");
        }

        String text = choices.get(0).path("message").path("content").asText();
        log.info("Groq response text (first 200): {}", text.substring(0, Math.min(200, text.length())));
        return text;
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private boolean isApiKeySet() {
        return groqApiKey != null
            && !groqApiKey.isBlank()
            && !groqApiKey.startsWith("your-")
            && groqApiKey.startsWith("gsk_");
    }

    private List<Question> parseQuestions(String raw) {
        if (raw == null || raw.isBlank()) return new ArrayList<>();
        try {
            String cleaned = raw
                .replaceAll("(?s)```json\\s*", "")
                .replaceAll("(?s)```\\s*", "")
                .trim();
            int start = cleaned.indexOf('[');
            int end   = cleaned.lastIndexOf(']');
            if (start == -1 || end == -1 || end <= start) {
                log.error("No JSON array found in: {}", cleaned.substring(0, Math.min(300, cleaned.length())));
                return new ArrayList<>();
            }
            cleaned = cleaned.substring(start, end + 1);
            JsonNode arr = objectMapper.readTree(cleaned);
            List<Question> list = new ArrayList<>();
            for (JsonNode n : arr) {
                String ca = n.path("correctAnswer").asText("A").trim().toUpperCase();
                if (ca.length() > 1) ca = ca.substring(0, 1);
                list.add(Question.builder()
                    .questionText(n.path("question").asText())
                    .optionA(n.path("optionA").asText())
                    .optionB(n.path("optionB").asText())
                    .optionC(n.path("optionC").asText())
                    .optionD(n.path("optionD").asText())
                    .correctAnswer(ca)
                    .explanation(n.path("explanation").asText())
                    .build());
            }
            log.info("Parsed {} questions", list.size());
            return list;
        } catch (Exception e) {
            log.error("parseQuestions failed: {}", e.getMessage());
            return new ArrayList<>();
        }
    }

    private List<Question> generateFallbackQuestions(GenerateQuizRequest req) {
        List<Question> list = new ArrayList<>();
        for (int i = 1; i <= Math.min(req.getCount(), 3); i++) {
            list.add(Question.builder()
                .questionText("Sample " + req.getSubject() + " question " + i + " (AI unavailable)")
                .optionA("Option A").optionB("Option B")
                .optionC("Option C").optionD("Option D")
                .correctAnswer("A")
                .explanation("Check GROQ_API_KEY in .env and restart.")
                .build());
        }
        return list;
    }
}
