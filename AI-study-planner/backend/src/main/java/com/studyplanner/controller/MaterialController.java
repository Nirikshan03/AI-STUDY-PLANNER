package com.studyplanner.controller;
import com.studyplanner.model.Material;
import com.studyplanner.service.MaterialService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;

@RestController
@RequestMapping("/api/materials")
@RequiredArgsConstructor
public class MaterialController {
    private final MaterialService materialService;

    @PostMapping("/upload")
    public ResponseEntity<?> upload(
            @RequestParam("file") MultipartFile file,
            @RequestParam("userId") Long userId,
            @RequestParam("subject") String subject) {
        try {
            return ResponseEntity.ok(materialService.uploadMaterial(file, userId, subject));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Upload failed: " + e.getMessage());
        }
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Material>> getUserMaterials(@PathVariable Long userId) {
        return ResponseEntity.ok(materialService.getUserMaterials(userId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Material> getMaterial(@PathVariable Long id) {
        return ResponseEntity.ok(materialService.getMaterial(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteMaterial(@PathVariable Long id) {
        materialService.deleteMaterial(id);
        return ResponseEntity.noContent().build();
    }
}