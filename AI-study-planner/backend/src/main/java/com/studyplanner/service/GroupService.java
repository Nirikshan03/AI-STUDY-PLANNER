package com.studyplanner.service;
import com.studyplanner.dto.*;
import com.studyplanner.model.*;
import com.studyplanner.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class GroupService {
    private final StudyGroupRepository groupRepo;
    private final GroupMemberRepository memberRepo;
    private final GroupChallengeRepository challengeRepo;

    public StudyGroup createGroup(CreateGroupRequest req) {
        String code = UUID.randomUUID().toString().substring(0,6).toUpperCase();
        StudyGroup group = groupRepo.save(StudyGroup.builder()
            .name(req.getName()).subjectFocus(req.getSubjectFocus())
            .createdByUserId(req.getUserId()).inviteCode(code).build());
        memberRepo.save(GroupMember.builder()
            .group(group).userId(req.getUserId())
            .userName(req.getUserName()).userEmail(req.getUserEmail()).build());
        return group;
    }

    public GroupMember joinGroup(JoinGroupRequest req) {
        StudyGroup group = groupRepo.findByInviteCode(req.getInviteCode())
            .orElseThrow(() -> new RuntimeException("Invalid invite code"));
        memberRepo.findByGroupIdAndUserId(group.getId(), req.getUserId())
            .ifPresent(m -> { throw new RuntimeException("Already a member"); });
        return memberRepo.save(GroupMember.builder()
            .group(group).userId(req.getUserId())
            .userName(req.getUserName()).userEmail(req.getUserEmail()).build());
    }

    public List<StudyGroup> getUserGroups(Long userId) { return groupRepo.findGroupsByUserId(userId); }

    public List<GroupMember> getLeaderboard(Long groupId) { return memberRepo.findByGroupIdOrderByXpScoreDesc(groupId); }

    public GroupMember addXp(Long groupId, Long userId, int xp) {
        GroupMember m = memberRepo.findByGroupIdAndUserId(groupId, userId)
            .orElseThrow(() -> new RuntimeException("Member not found"));
        m.setXpScore(m.getXpScore() + xp);
        m.setQuizzesCompleted(m.getQuizzesCompleted() + 1);
        return memberRepo.save(m);
    }

    public List<GroupChallenge> getActiveChallenges(Long groupId) {
        return challengeRepo.findByGroupIdAndEndDateGreaterThanEqual(groupId, LocalDate.now());
    }

    public GroupChallenge createChallenge(Long groupId, CreateChallengeRequest req) {
        return challengeRepo.save(GroupChallenge.builder()
            .groupId(groupId).title(req.getTitle()).description(req.getDescription())
            .subject(req.getSubject()).targetCount(req.getTargetCount())
            .xpReward(req.getXpReward()).endDate(req.getEndDate()).build());
    }
}