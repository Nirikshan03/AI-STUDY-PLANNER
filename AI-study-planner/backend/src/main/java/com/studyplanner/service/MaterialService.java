package com.studyplanner.service;
import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.studyplanner.model.Material;
import com.studyplanner.repository.MaterialRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class MaterialService {
    private final MaterialRepository materialRepo;
    private final AIQuizService aiQuizService;

    @Value("${cloudinary.cloud-name:}") private String cloudName;
    @Value("${cloudinary.api-key:}")    private String apiKey;
    @Value("${cloudinary.api-secret:}") private String apiSecret;

    private Cloudinary getCloudinary() {
        return new Cloudinary(ObjectUtils.asMap(
            "cloud_name", cloudName, "api_key", apiKey, "api_secret", apiSecret));
    }

    public Material uploadMaterial(MultipartFile file, Long userId, String subject) throws Exception {
        String url = "", publicId = "";
        if (cloudName != null && !cloudName.isBlank()) {
            try {
                Map<?,?> result = getCloudinary().uploader().upload(file.getBytes(),
                    ObjectUtils.asMap("folder", "studyplanner/user_" + userId,
                        "resource_type", "raw",
                        "public_id", System.currentTimeMillis() + "_" + file.getOriginalFilename()));
                url      = (String) result.get("secure_url");
                publicId = (String) result.get("public_id");
            } catch (Exception e) {
                log.warn("Cloudinary upload skipped: {}", e.getMessage());
            }
        }

        Material m = Material.builder()
            .userId(userId).subjectName(subject)
            .fileName(file.getOriginalFilename())
            .fileType(file.getContentType())
            .fileSize(file.getSize())
            .fileUrl(url)
            .cloudinaryPublicId(publicId)
            .status(Material.ProcessingStatus.PROCESSING)
            .build();

        Material saved = materialRepo.save(m);
        processAsync(saved.getId(), file.getBytes());
        return saved;
    }

    @Async
    public void processAsync(Long id, byte[] bytes) {
        try {
            Material m = materialRepo.findById(id).orElseThrow();
            String text = extractText(bytes);
            m.setExtractedText(text);
            String summary = aiQuizService.callAISummary(
                "Summarize this study material in 5 key bullet points: " +
                (text.isBlank() ? "No text could be extracted from this file." :
                    text.substring(0, Math.min(2000, text.length()))));
            m.setAiSummary(summary);
            m.setStatus(Material.ProcessingStatus.DONE);
            materialRepo.save(m);
            log.info("Material {} processed successfully", id);
        } catch (Exception e) {
            log.error("Processing failed for material {}: {}", id, e.getMessage());
            materialRepo.findById(id).ifPresent(m -> {
                m.setStatus(Material.ProcessingStatus.FAILED);
                m.setAiSummary("Processing failed: " + e.getMessage());
                materialRepo.save(m);
            });
        }
    }

    private String extractText(byte[] bytes) {
        try (PDDocument doc = Loader.loadPDF(bytes)) {
            return new PDFTextStripper().getText(doc);
        } catch (Exception e) {
            log.warn("PDF text extraction failed: {}", e.getMessage());
            return "";
        }
    }

    public List<Material> getUserMaterials(Long userId) {
        return materialRepo.findByUserIdOrderByUploadedAtDesc(userId);
    }

    public Material getMaterial(Long id) {
        return materialRepo.findById(id).orElseThrow(() -> new RuntimeException("Material not found"));
    }

    public void deleteMaterial(Long id) {
        Material m = getMaterial(id);
        if (cloudName != null && !cloudName.isBlank() &&
            m.getCloudinaryPublicId() != null && !m.getCloudinaryPublicId().isBlank()) {
            try { getCloudinary().uploader().destroy(m.getCloudinaryPublicId(), ObjectUtils.emptyMap()); }
            catch (Exception e) { log.warn("Cloudinary delete failed: {}", e.getMessage()); }
        }
        materialRepo.deleteById(id);
    }
}