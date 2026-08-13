package com.internportal.backend.repository;

import com.internportal.backend.domain.entity.DuolingoUpdate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DuolingoRepository extends JpaRepository<DuolingoUpdate, UUID> {
    Optional<DuolingoUpdate> findFirstByInternIdOrderByUpdateDateDesc(UUID internId);
    Optional<DuolingoUpdate> findByInternIdAndUpdateDate(UUID internId, LocalDate updateDate);
    List<DuolingoUpdate> findByInternIdOrderByUpdateDateDesc(UUID internId);
    Optional<DuolingoUpdate> findByScreenshotUrlContaining(String filename);
}
