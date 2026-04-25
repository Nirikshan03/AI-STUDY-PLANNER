package com.studyplanner.controller;
import com.studyplanner.dto.*;
import com.studyplanner.model.*;
import com.studyplanner.service.GroupService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/groups")
@RequiredArgsConstructor
public class GroupController {
    private final GroupService groupService;

    @PostMapping
    public ResponseEntity<StudyGroup> create(@RequestBody CreateGroupRequest req) {
        return ResponseEntity.ok(groupService.createGroup(req));
    }

    @PostMapping("/join")
    public ResponseEntity<GroupMember> join(@RequestBody JoinGroupRequest req) {
        return ResponseEntity.ok(groupService.joinGroup(req));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<StudyGroup>> getUserGroups(@PathVariable Long userId) {
        return ResponseEntity.ok(groupService.getUserGroups(userId));
    }

    @GetMapping("/{groupId}/leaderboard")
    public ResponseEntity<List<GroupMember>> leaderboard(@PathVariable Long groupId) {
        return ResponseEntity.ok(groupService.getLeaderboard(groupId));
    }

    @PostMapping("/{groupId}/xp")
    public ResponseEntity<GroupMember> addXp(@PathVariable Long groupId, @RequestBody AddXpRequest req) {
        return ResponseEntity.ok(groupService.addXp(groupId, req.getUserId(), req.getXp()));
    }

    @GetMapping("/{groupId}/challenges")
    public ResponseEntity<List<GroupChallenge>> challenges(@PathVariable Long groupId) {
        return ResponseEntity.ok(groupService.getActiveChallenges(groupId));
    }

    @PostMapping("/{groupId}/challenges")
    public ResponseEntity<GroupChallenge> createChallenge(
            @PathVariable Long groupId, @RequestBody CreateChallengeRequest req) {
        return ResponseEntity.ok(groupService.createChallenge(groupId, req));
    }
}