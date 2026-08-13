package com.internportal.backend.controller;

import com.internportal.backend.dto.request.LoginRequest;
import com.internportal.backend.dto.request.OtpSendRequest;
import com.internportal.backend.dto.request.OtpVerifyRequest;
import com.internportal.backend.dto.request.RefreshTokenRequest;
import com.internportal.backend.dto.request.RegisterRequest;
import com.internportal.backend.dto.response.ApiResponse;
import com.internportal.backend.dto.response.AuthResponse;
import com.internportal.backend.service.AuthService;
import com.internportal.backend.service.OtpService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication API", description = "Endpoints for Intern Registration, Login, and Token Refresh")
public class AuthController {

    private final AuthService authService;
    private final OtpService otpService;

    @PostMapping("/otp/send")
    @Operation(summary = "Send OTP to email")
    public ResponseEntity<ApiResponse<Void>> sendOtp(@Valid @RequestBody OtpSendRequest request) {
        otpService.generateAndSendOtp(request.getEmail(), request.getPurpose());
        return ResponseEntity.ok(ApiResponse.success("OTP sent to email", null));
    }

    @PostMapping("/otp/verify")
    @Operation(summary = "Verify OTP")
    public ResponseEntity<ApiResponse<Void>> verifyOtp(@Valid @RequestBody OtpVerifyRequest request) {
        otpService.verifyOtp(request.getEmail(), request.getOtp(), request.getPurpose());
        return ResponseEntity.ok(ApiResponse.success("OTP verified successfully", null));
    }

    @PostMapping("/register")
    @Operation(summary = "Register new intern account (Status defaults to PENDING_APPROVAL)")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.registerIntern(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Registration request submitted successfully. Awaiting batch manager approval.", response));
    }

    @PostMapping("/login")
    @Operation(summary = "Login with email & password")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success("Login successful", response));
    }

    @PostMapping("/refresh-token")
    @Operation(summary = "Refresh JWT access token")
    public ResponseEntity<ApiResponse<AuthResponse>> refreshToken(@Valid @RequestBody RefreshTokenRequest request) {
        AuthResponse response = authService.refreshToken(request);
        return ResponseEntity.ok(ApiResponse.success("Token refreshed successfully", response));
    }
}
