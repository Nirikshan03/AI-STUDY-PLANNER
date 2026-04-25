package com.studyplanner.repository;
import com.studyplanner.model.QuizAttempt;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface QuizAttemptRepository extends JpaRepository<QuizAttempt, Long> {
    List<QuizAttempt> findByUserIdOrderByAttemptedAtDesc(Long userId);
    List<QuizAttempt> findByUserId(Long userId);
}