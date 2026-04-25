package com.studyplanner.repository;
import com.studyplanner.model.Quiz;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface QuizRepository extends JpaRepository<Quiz, Long> {
    List<Quiz> findByUserIdOrderByCreatedAtDesc(Long userId);
}