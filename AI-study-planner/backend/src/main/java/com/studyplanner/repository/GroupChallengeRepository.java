package com.studyplanner.repository;
import com.studyplanner.model.GroupChallenge;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;
public interface GroupChallengeRepository extends JpaRepository<GroupChallenge, Long> {
    List<GroupChallenge> findByGroupIdAndEndDateGreaterThanEqual(Long groupId, LocalDate date);
}