package com.internportal.backend.dto.response;

import com.internportal.backend.domain.enums.AccountStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class AdminAccountResponse {
    private UUID id;
    private String fullName;
    private String email;
    private AccountStatus status;
    private LocalDateTime createdAt;
}
