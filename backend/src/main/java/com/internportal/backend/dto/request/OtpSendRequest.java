package com.internportal.backend.dto.request;

import com.internportal.backend.domain.enums.OtpPurpose;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class OtpSendRequest {
    @NotBlank(message = "Email is required")
    @Email(message = "Valid email address is required")
    private String email;

    @NotNull(message = "Purpose is required")
    private OtpPurpose purpose;
}
