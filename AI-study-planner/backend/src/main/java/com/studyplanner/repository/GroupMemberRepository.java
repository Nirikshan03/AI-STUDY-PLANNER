package com.studyplanner.repository;
import com.studyplanner.model.GroupMember;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
public interface GroupMemberRepository extends JpaRepository<GroupMember, Long> {
    List<GroupMember> findByGroupIdOrderByXpScoreDesc(Long groupId);
    Optional<GroupMember> findByGroupIdAndUserId(Long groupId, Long userId);
}