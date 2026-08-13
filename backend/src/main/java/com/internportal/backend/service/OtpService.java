package com.internportal.backend.service;

import com.internportal.backend.domain.entity.OtpVerification;
import com.internportal.backend.domain.enums.OtpPurpose;
import com.internportal.backend.exception.CustomException;
import com.internportal.backend.repository.OtpVerificationRepository;
import com.internportal.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class OtpService {

    private final OtpVerificationRepository otpRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;
    private final SecureRandom secureRandom = new SecureRandom();

    private static final int OTP_EXPIRATION_MINUTES = 10;
    private static final int OTP_RESEND_COOLDOWN_SECONDS = 60;
    private static final int MAX_OTP_ATTEMPTS = 5;

    @Transactional
    public void generateAndSendOtp(String email, OtpPurpose purpose) {
        String normalizedEmail = email.trim().toLowerCase();

        // Check duplicate email
        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new CustomException("An account with this email already exists.", HttpStatus.BAD_REQUEST);
        }

        // Check if there is an existing OTP and enforce cooldown
        List<OtpVerification> existingList = otpRepository.findAllByEmailAndPurpose(normalizedEmail, purpose);
        for (OtpVerification existing : existingList) {
            if (existing.getCreatedAt().plusSeconds(OTP_RESEND_COOLDOWN_SECONDS).isAfter(LocalDateTime.now())) {
                throw new CustomException("Please wait before requesting another code.", HttpStatus.TOO_MANY_REQUESTS);
            }
            // Delete old OTPs for this purpose
            otpRepository.delete(existing);
        }

        // Generate 6-digit OTP
        String otp = String.format("%06d", secureRandom.nextInt(1000000));
        String otpHash = passwordEncoder.encode(otp);

        OtpVerification otpVerification = OtpVerification.builder()
                .email(normalizedEmail)
                .otpHash(otpHash)
                .purpose(purpose)
                .expiresAt(LocalDateTime.now().plusMinutes(OTP_EXPIRATION_MINUTES))
                .attempts(0)
                .verified(false)
                .build();

        otpRepository.save(otpVerification);

        emailService.sendOtpEmail(normalizedEmail, otp);
    }

    @Transactional
    public void verifyOtp(String email, String otp, OtpPurpose purpose) {
        String normalizedEmail = email.trim().toLowerCase();

        OtpVerification otpVerification = otpRepository.findByEmailAndPurpose(normalizedEmail, purpose)
                .orElseThrow(() -> new CustomException("No pending verification found for this email.", HttpStatus.BAD_REQUEST));

        if (otpVerification.isVerified()) {
            throw new CustomException("Email is already verified.", HttpStatus.BAD_REQUEST);
        }

        if (otpVerification.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new CustomException("Verification code has expired. Please request a new code.", HttpStatus.BAD_REQUEST);
        }

        if (otpVerification.getAttempts() >= MAX_OTP_ATTEMPTS) {
            otpRepository.delete(otpVerification);
            throw new CustomException("Too many verification attempts. Please request a new code.", HttpStatus.BAD_REQUEST);
        }

        if (!passwordEncoder.matches(otp, otpVerification.getOtpHash())) {
            otpVerification.setAttempts(otpVerification.getAttempts() + 1);
            otpRepository.save(otpVerification);
            throw new CustomException("Invalid verification code.", HttpStatus.BAD_REQUEST);
        }

        otpVerification.setVerified(true);
        otpRepository.save(otpVerification);
    }

    @Transactional
    public void consumeVerifiedOtp(String email, OtpPurpose purpose) {
        String normalizedEmail = email.trim().toLowerCase();
        
        OtpVerification otpVerification = otpRepository.findByEmailAndPurpose(normalizedEmail, purpose)
                .orElseThrow(() -> new CustomException("Email verification not found.", HttpStatus.BAD_REQUEST));
                
        if (!otpVerification.isVerified()) {
            throw new CustomException("Email has not been verified.", HttpStatus.BAD_REQUEST);
        }
        
        if (otpVerification.getExpiresAt().isBefore(LocalDateTime.now())) {
            otpRepository.delete(otpVerification);
            throw new CustomException("Verification has expired. Please verify your email again.", HttpStatus.BAD_REQUEST);
        }
        
        otpRepository.delete(otpVerification);
    }
}
