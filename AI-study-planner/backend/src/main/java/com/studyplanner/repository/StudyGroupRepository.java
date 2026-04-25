package com.studyplanner.repository;
import com.studyplanner.model.StudyGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;
public interface StudyGroupRepository extends JpaRepository<StudyGroup, Long> {
    Optional<StudyGroup> findByInviteCode(String inviteCode);
    @Query("SELECT gm.group FROM GroupMember gm WHERE gm.userId=:uid")
    List<StudyGroup> findGroupsByUserId(@Param("uid") Long userId);
}