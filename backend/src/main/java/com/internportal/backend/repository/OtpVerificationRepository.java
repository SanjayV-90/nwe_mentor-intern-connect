package com.internportal.backend.repository;

import com.internportal.backend.domain.entity.OtpVerification;
import com.internportal.backend.domain.enums.OtpPurpose;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;
import java.util.List;

public interface OtpVerificationRepository extends JpaRepository<OtpVerification, UUID> {
    Optional<OtpVerification> findByEmailAndPurpose(String email, OtpPurpose purpose);
    List<OtpVerification> findAllByEmailAndPurpose(String email, OtpPurpose purpose);
}
