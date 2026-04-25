package com.studyplanner.repository;
import com.studyplanner.model.SubjectScore;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
public interface SubjectScoreRepository extends JpaRepository<SubjectScore, Long> {
    @Query("SELECT s.subject, AVG(s.scorePercent) FROM SubjectScore s WHERE s.userId=:uid GROUP BY s.subject")
    List<Object[]> getAverageBySubject(@Param("uid") Long userId);
    @Query("SELECT s.topic, AVG(s.scorePercent) FROM SubjectScore s WHERE s.userId=:uid GROUP BY s.topic ORDER BY AVG(s.scorePercent) ASC")
    List<Object[]> getWeakTopics(@Param("uid") Long userId);
}