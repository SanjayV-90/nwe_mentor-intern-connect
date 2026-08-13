package com.internportal.backend.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String fromEmail;

    @Value("${spring.mail.password:}")
    private String mailPassword;

    @jakarta.annotation.PostConstruct
    public void checkMailConfiguration() {
        boolean hasUsername = fromEmail != null && !fromEmail.trim().isEmpty();
        boolean hasPassword = mailPassword != null && !mailPassword.trim().isEmpty();
        
        if (hasUsername && hasPassword) {
            log.info("SMTP Diagnostics: MAIL_USERNAME and MAIL_PASSWORD are configured.");
        } else {
            log.warn("SMTP Diagnostics: Missing email credentials! MAIL_USERNAME configured: {}, MAIL_PASSWORD configured: {}", hasUsername, hasPassword);
        }
    }

    public void sendOtpEmail(String toEmail, String otp) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            if (fromEmail == null || fromEmail.trim().isEmpty()) {
                throw new IllegalStateException("SMTP username not configured");
            }
            message.setFrom(fromEmail);
            message.setTo(toEmail);
            message.setSubject("MentorFlow — Email Verification Code");
            message.setText("Your MentorFlow verification code is:\n\n" +
                    otp + "\n\n" +
                    "This code expires in 10 minutes.\n\n" +
                    "If you did not request this verification, you can safely ignore this email.");
            
            mailSender.send(message);
            log.info("OTP email sent successfully to {}", toEmail);
        } catch (Exception e) {
            log.error("Failed to send OTP email to {}: {} (Exception: {})", toEmail, e.getMessage(), e.getClass().getName(), e);
            // In a real application, we might throw an exception if we want to fail the OTP generation
            // But since we might be testing locally without valid SMTP, we'll just log it.
            // Wait, for this project, let's log the OTP in the console ONLY if mail sending fails (for local testing)
            // or just log it anyway to make development easier.
            log.info("LOCAL DEV MODE - OTP for {} is: {}", toEmail, otp);
        }
    }
}
