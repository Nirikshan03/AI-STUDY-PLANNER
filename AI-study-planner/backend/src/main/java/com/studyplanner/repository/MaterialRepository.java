package com.studyplanner.repository;
import com.studyplanner.model.Material;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface MaterialRepository extends JpaRepository<Material, Long> {
    List<Material> findByUserIdOrderByUploadedAtDesc(Long userId);
}