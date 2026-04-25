package com.studyplanner.repository;
import com.studyplanner.model.StudySession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDate;
import java.util.List;
public interface StudySessionRepository extends JpaRepository<StudySession, Long> {
    List<StudySession> findByUserIdAndStudyDateBetween(Long userId, LocalDate start, LocalDate end);
    @Query("SELECT SUM(s.durationMinutes) FROM StudySession s WHERE s.userId = :uid")
    Integer getTotalMinutes(@Param("uid") Long userId);
}