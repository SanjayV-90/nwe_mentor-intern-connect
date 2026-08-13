package com.internportal.backend.controller;

import com.internportal.backend.domain.entity.DuolingoUpdate;
import com.internportal.backend.domain.entity.InternProfile;
import com.internportal.backend.repository.DuolingoRepository;
import com.internportal.backend.repository.InternProfileRepository;
import com.internportal.backend.security.CustomUserDetails;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.nio.file.Path;
import java.nio.file.Paths;

@RestController
@RequestMapping("/api/v1/files")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "File API", description = "Serve uploaded screenshots and attachments")
public class FileController {

    private final InternProfileRepository internProfileRepository;
    private final DuolingoRepository duolingoRepository;

    @Value("${app.storage.upload-dir:./uploads}")
    private String uploadDir;

    @GetMapping("/{category}/{filename}")
    @Operation(summary = "Serve image or document file")
    public ResponseEntity<Resource> serveFile(
            @PathVariable String category,
            @PathVariable String filename,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        try {
            if (category.equalsIgnoreCase("resumes")) {
                if (userDetails == null) {
                    return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
                }
                boolean isAdmin = userDetails.getAuthorities().stream()
                        .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
                if (!isAdmin) {
                    boolean isOwner = false;
                    if (userDetails.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_INTERN"))) {
                        InternProfile profile = internProfileRepository.findByUserId(userDetails.getId()).orElse(null);
                        if (profile != null && profile.getResumeUrl() != null && profile.getResumeUrl().contains(filename)) {
                            isOwner = true;
                        }
                    }
                    if (!isOwner) {
                        log.warn("Unauthorized resume access attempt by user {} for file {}", userDetails.getUsername(), filename);
                        return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
                    }
                }
            } else if (category.equalsIgnoreCase("duolingo")) {
                if (userDetails == null) {
                    return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
                }
                boolean isAdmin = userDetails.getAuthorities().stream()
                        .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
                if (!isAdmin) {
                    boolean isOwner = false;
                    if (userDetails.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_INTERN"))) {
                        DuolingoUpdate update = duolingoRepository.findByScreenshotUrlContaining(filename).orElse(null);
                        if (update != null && update.getIntern().getId().equals(userDetails.getId())) {
                            isOwner = true;
                        }
                    }
                    if (!isOwner) {
                        log.warn("Unauthorized duolingo proof access attempt by user {} for file {}", userDetails.getUsername(), filename);
                        return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
                    }
                }
            }

            Path root = Paths.get(uploadDir).toAbsolutePath().normalize();
            Path filePath = root.resolve(category).resolve(filename).normalize();
            if (!filePath.startsWith(root)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }

            Resource resource = new UrlResource(filePath.toUri());
            if (resource.exists() && resource.isReadable()) {
                String contentType = "application/octet-stream";
                if (filename.endsWith(".png")) contentType = "image/png";
                else if (filename.endsWith(".jpg") || filename.endsWith(".jpeg")) contentType = "image/jpeg";
                else if (filename.endsWith(".pdf")) contentType = "application/pdf";

                return ResponseEntity.ok()
                        .contentType(MediaType.parseMediaType(contentType))
                        .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                        .body(resource);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            log.error("Error serving file: ", e);
            return ResponseEntity.notFound().build();
        }
    }
}
