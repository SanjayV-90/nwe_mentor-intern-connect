package com.internportal.backend.dto.request;

import com.internportal.backend.domain.enums.OtpPurpose;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class OtpVerifyRequest {
    @NotBlank(message = "Email is required")
    @Email(message = "Valid email address is required")
    private String email;

    @NotBlank(message = "OTP is required")
    @Size(min = 6, max = 6, message = "OTP must be exactly 6 digits")
    private String otp;

    @NotNull(message = "Purpose is required")
    private OtpPurpose purpose;
}
