package com.internportal.backend.service;

import com.internportal.backend.domain.entity.InternProfile;
import com.internportal.backend.domain.entity.RefreshToken;
import com.internportal.backend.domain.entity.Role;
import com.internportal.backend.domain.entity.User;
import com.internportal.backend.domain.enums.AccountStatus;
import com.internportal.backend.domain.enums.OtpPurpose;
import com.internportal.backend.domain.enums.RoleType;
import com.internportal.backend.dto.request.LoginRequest;
import com.internportal.backend.dto.request.RefreshTokenRequest;
import com.internportal.backend.dto.request.RegisterRequest;
import com.internportal.backend.dto.response.AuthResponse;
import com.internportal.backend.exception.CustomException;
import com.internportal.backend.repository.InternProfileRepository;
import com.internportal.backend.repository.RefreshTokenRepository;
import com.internportal.backend.repository.RoleRepository;
import com.internportal.backend.repository.UserRepository;
import com.internportal.backend.security.CustomUserDetails;
import com.internportal.backend.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final InternProfileRepository internProfileRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final AuthenticationManager authenticationManager;
    private final OtpService otpService;

    @Value("${app.jwt.refresh-expiration-ms}")
    private long refreshTokenDurationMs;

    @Transactional
    public AuthResponse registerIntern(RegisterRequest request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase();
        
        // Consume OTP verification
        otpService.consumeVerifiedOtp(normalizedEmail, OtpPurpose.INTERN_REGISTRATION);
        
        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new CustomException("Email is already registered!", HttpStatus.BAD_REQUEST);
        }

        Role internRole = roleRepository.findByName(RoleType.INTERN)
                .orElseThrow(() -> new CustomException("INTERN role not configured in database", HttpStatus.INTERNAL_SERVER_ERROR));

        User user = User.builder()
                .email(normalizedEmail)
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .status(AccountStatus.PENDING_APPROVAL)
                .role(internRole)
                .deleted(false)
                .build();

        User savedUser = userRepository.save(user);

        InternProfile profile = InternProfile.builder()
                .user(savedUser)
                .employeeId("INT-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                .fullName(request.getFullName())
                .gender(request.getGender())
                .dob(request.getDob())
                .phone(request.getPhone())
                .address(request.getAddress())
                .college(request.getCollege())
                .degree(request.getDegree())
                .department(request.getDepartment())
                .currentTechStack(request.getTechStack())
                .primarySkill(request.getPrimarySkill())
                .secondarySkill(request.getSecondarySkill())
                .githubUrl(request.getGithubUrl())
                .linkedinUrl(request.getLinkedinUrl())
                .build();

        internProfileRepository.save(profile);

        return AuthResponse.builder()
                .userId(savedUser.getId())
                .email(savedUser.getEmail())
                .role(RoleType.INTERN)
                .status(AccountStatus.PENDING_APPROVAL)
                .fullName(request.getFullName())
                .build();
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase();
        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new CustomException("Invalid email or password", HttpStatus.UNAUTHORIZED));

        if (user.isDeleted() || user.getStatus() == AccountStatus.DISABLED) {
            throw new CustomException("Your account has been DISABLED or DELETED by batch manager.", HttpStatus.FORBIDDEN);
        }
        if (user.getStatus() == AccountStatus.PENDING_APPROVAL) {
            throw new CustomException("Your account registration is currently PENDING APPROVAL by batch manager.", HttpStatus.FORBIDDEN);
        }
        if (user.getStatus() == AccountStatus.REJECTED) {
            throw new CustomException("Your account registration request was REJECTED.", HttpStatus.FORBIDDEN);
        }

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(normalizedEmail, request.getPassword()));

        user.setLastLoginAt(LocalDateTime.now());
        userRepository.save(user);

        String accessToken = jwtTokenProvider.generateToken(authentication);
        RefreshToken refreshToken = createRefreshToken(user);

        String fullName = user.getEmail();
        String photoUrl = null;
        if (user.getInternProfile() != null) {
            fullName = user.getInternProfile().getFullName();
            photoUrl = user.getInternProfile().getProfilePictureUrl();
        } else if (user.getRole().getName() == RoleType.ADMIN) {
            fullName = user.getFullName() != null ? user.getFullName() : "Batch Manager";
        }

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken.getToken())
                .userId(user.getId())
                .email(user.getEmail())
                .role(user.getRole().getName())
                .status(user.getStatus())
                .fullName(fullName)
                .profilePictureUrl(photoUrl)
                .build();
    }

    @Transactional
    public AuthResponse refreshToken(RefreshTokenRequest request) {
        String requestRefreshToken = request.getRefreshToken();
        RefreshToken token = refreshTokenRepository.findByToken(requestRefreshToken)
                .orElseThrow(() -> new CustomException("Refresh token is not in database!", HttpStatus.FORBIDDEN));

        if (token.isRevoked() || token.getExpiryDate().isBefore(LocalDateTime.now())) {
            refreshTokenRepository.delete(token);
            throw new CustomException("Refresh token was expired or revoked. Please login again.", HttpStatus.FORBIDDEN);
        }

        User user = token.getUser();
        if (user.isDeleted() || user.getStatus() == AccountStatus.DISABLED) {
            refreshTokenRepository.delete(token);
            throw new CustomException("Your account has been DISABLED or DELETED by batch manager.", HttpStatus.FORBIDDEN);
        }
        if (user.getStatus() == AccountStatus.REJECTED || user.getStatus() == AccountStatus.PENDING_APPROVAL) {
            refreshTokenRepository.delete(token);
            throw new CustomException("Your account registration is not active.", HttpStatus.FORBIDDEN);
        }
        String accessToken = jwtTokenProvider.generateTokenFromUsername(user.getEmail());

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(requestRefreshToken)
                .userId(user.getId())
                .email(user.getEmail())
                .role(user.getRole().getName())
                .status(user.getStatus())
                .build();
    }

    private RefreshToken createRefreshToken(User user) {
        refreshTokenRepository.deleteByUser(user);
        RefreshToken refreshToken = RefreshToken.builder()
                .user(user)
                .token(UUID.randomUUID().toString())
                .expiryDate(LocalDateTime.now().plusSeconds(refreshTokenDurationMs / 1000))
                .revoked(false)
                .build();
        return refreshTokenRepository.save(refreshToken);
    }
}
