package com.internportal.backend.service;

import com.internportal.backend.domain.entity.Assignment;
import com.internportal.backend.domain.entity.AssignmentScreenshot;
import com.internportal.backend.domain.entity.InternProfile;
import com.internportal.backend.domain.entity.Role;
import com.internportal.backend.domain.entity.User;
import com.internportal.backend.domain.enums.AccountStatus;
import com.internportal.backend.domain.enums.OtpPurpose;
import com.internportal.backend.domain.enums.RoleType;
import com.internportal.backend.dto.response.InternProfileResponse;
import com.internportal.backend.exception.CustomException;
import com.internportal.backend.mapper.EntityMapper;
import com.internportal.backend.repository.AssignmentRepository;
import com.internportal.backend.repository.InternProfileRepository;
import com.internportal.backend.repository.RefreshTokenRepository;
import com.internportal.backend.repository.RoleRepository;
import com.internportal.backend.repository.UserRepository;
import com.internportal.backend.dto.request.AdminCreationRequest;
import com.internportal.backend.dto.response.AdminAccountResponse;
import org.springframework.security.crypto.password.PasswordEncoder;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminService {

    private final UserRepository userRepository;
    private final InternProfileRepository internProfileRepository;
    private final EntityMapper entityMapper;
    private final NotificationService notificationService;
    private final AssignmentRepository assignmentRepository;
    private final StorageService storageService;
    private final RefreshTokenRepository refreshTokenRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final OtpService otpService;

    @Transactional(readOnly = true)
    public Page<InternProfileResponse> getAllInterns(AccountStatus status, String search, Pageable pageable) {
        Specification<InternProfile> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            predicates.add(cb.equal(root.get("user").get("role").get("name"), RoleType.INTERN));
            predicates.add(cb.equal(root.get("user").get("deleted"), false));

            if (status != null) {
                predicates.add(cb.equal(root.get("user").get("status"), status));
            }

            if (StringUtils.hasText(search)) {
                String searchLike = "%" + search.toLowerCase() + "%";
                Predicate namePred = cb.like(cb.lower(root.get("fullName")), searchLike);
                Predicate emailPred = cb.like(cb.lower(root.get("user").get("email")), searchLike);
                Predicate collegePred = cb.like(cb.lower(root.get("college")), searchLike);
                Predicate techPred = cb.like(cb.lower(root.get("currentTechStack")), searchLike);
                predicates.add(cb.or(namePred, emailPred, collegePred, techPred));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return internProfileRepository.findAll(spec, pageable).map(entityMapper::toInternProfileResponse);
    }

    @Transactional(readOnly = true)
    public InternProfileResponse getInternById(UUID id) {
        InternProfile profile = internProfileRepository.findByUserId(id)
                .orElseThrow(() -> new CustomException("Intern profile not found for user ID: " + id, HttpStatus.NOT_FOUND));
        if (profile.getUser().isDeleted()) {
            throw new CustomException("Intern profile not found", HttpStatus.NOT_FOUND);
        }
        return entityMapper.toInternProfileResponse(profile);
    }

    @Transactional
    public InternProfileResponse approveIntern(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException("User not found with ID: " + userId, HttpStatus.NOT_FOUND));

        if (user.getStatus() == AccountStatus.ACTIVE) {
            throw new CustomException("Intern is already active!", HttpStatus.BAD_REQUEST);
        }

        user.setStatus(AccountStatus.ACTIVE);
        userRepository.save(user);

        InternProfile profile = internProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new CustomException("Profile missing for intern", HttpStatus.NOT_FOUND));

        if (profile.getJoiningDate() == null) {
            profile.setJoiningDate(LocalDate.now());
            internProfileRepository.save(profile);
        }

        return entityMapper.toInternProfileResponse(profile);
    }

    @Transactional
    public InternProfileResponse rejectIntern(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException("User not found with ID: " + userId, HttpStatus.NOT_FOUND));

        if (user.getRole().getName() != RoleType.INTERN) {
            throw new CustomException("Only INTERN accounts can be rejected", HttpStatus.BAD_REQUEST);
        }

        if (user.getStatus() == AccountStatus.REJECTED) {
            throw new CustomException("Intern is already rejected!", HttpStatus.BAD_REQUEST);
        }

        user.setStatus(AccountStatus.REJECTED);
        userRepository.save(user);
        refreshTokenRepository.deleteByUser(user);

        InternProfile profile = internProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new CustomException("Profile missing for intern", HttpStatus.NOT_FOUND));

        return entityMapper.toInternProfileResponse(profile);
    }

    @Transactional
    public InternProfileResponse disableIntern(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException("User not found with ID: " + userId, HttpStatus.NOT_FOUND));

        if (user.getRole().getName() != RoleType.INTERN) {
            throw new CustomException("Only INTERN accounts can be disabled through this endpoint", HttpStatus.BAD_REQUEST);
        }

        if (user.getStatus() == AccountStatus.DISABLED) {
            throw new CustomException("Intern is already disabled!", HttpStatus.BAD_REQUEST);
        }

        user.setStatus(AccountStatus.DISABLED);
        userRepository.save(user);
        refreshTokenRepository.deleteByUser(user);

        InternProfile profile = internProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new CustomException("Profile missing for intern", HttpStatus.NOT_FOUND));

        return entityMapper.toInternProfileResponse(profile);
    }

    @Transactional
    public InternProfileResponse enableIntern(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException("User not found with ID: " + userId, HttpStatus.NOT_FOUND));

        if (user.getRole().getName() != RoleType.INTERN) {
            throw new CustomException("Only INTERN accounts can be enabled", HttpStatus.BAD_REQUEST);
        }
        if (user.isDeleted()) {
            throw new CustomException("Cannot enable a deleted account. Deleted accounts cannot be restored.", HttpStatus.BAD_REQUEST);
        }
        if (user.getStatus() != AccountStatus.DISABLED) {
            throw new CustomException("Only disabled accounts can be enabled. Current status is " + user.getStatus(), HttpStatus.BAD_REQUEST);
        }

        user.setStatus(AccountStatus.ACTIVE);
        userRepository.save(user);

        InternProfile profile = internProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new CustomException("Profile missing for intern", HttpStatus.NOT_FOUND));

        return entityMapper.toInternProfileResponse(profile);
    }

    @Transactional
    public InternProfileResponse deleteIntern(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException("User not found with ID: " + userId, HttpStatus.NOT_FOUND));

        if (user.getRole().getName() != RoleType.INTERN) {
            throw new CustomException("Only INTERN accounts can be deleted through this endpoint", HttpStatus.BAD_REQUEST);
        }

        user.setDeleted(true);
        user.setStatus(AccountStatus.DISABLED);
        user.setEmail(user.getEmail() + "_deleted_" + UUID.randomUUID().toString());
        userRepository.save(user);
        refreshTokenRepository.deleteByUser(user);

        InternProfile profile = internProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new CustomException("Profile missing for intern", HttpStatus.NOT_FOUND));

        try {
            if (TransactionSynchronizationManager.isSynchronizationActive()) {
                TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                    @Override
                    public void afterCommit() {
                        cleanupInternFilesSafe(user, profile);
                    }
                });
            } else {
                cleanupInternFilesSafe(user, profile);
            }
        } catch (Exception e) {
            log.error("Error registering transaction synchronization for file cleanup of intern {}: {}", userId, e.getMessage(), e);
        }

        return entityMapper.toInternProfileResponse(profile);
    }

    private void cleanupInternFilesSafe(User user, InternProfile profile) {
        try {
            if (StringUtils.hasText(profile.getProfilePictureUrl())) {
                try {
                    storageService.deleteFile(profile.getProfilePictureUrl());
                } catch (Exception e) {
                    log.error("Failed to delete profile picture for user {}: {}", user.getId(), e.getMessage());
                }
            }
            if (StringUtils.hasText(profile.getResumeUrl())) {
                try {
                    storageService.deleteFile(profile.getResumeUrl());
                } catch (Exception e) {
                    log.error("Failed to delete resume for user {}: {}", user.getId(), e.getMessage());
                }
            }
            List<Assignment> assignments = assignmentRepository.findByInternIdOrderBySubmissionDateDesc(user.getId());
            if (assignments != null) {
                for (Assignment assignment : assignments) {
                    if (assignment.getScreenshots() != null) {
                        for (AssignmentScreenshot screenshot : assignment.getScreenshots()) {
                            if (StringUtils.hasText(screenshot.getFilePath())) {
                                try {
                                    storageService.deleteFile(screenshot.getFilePath());
                                } catch (Exception e) {
                                    log.error("Failed to delete assignment screenshot {} for user {}: {}", screenshot.getFilePath(), user.getId(), e.getMessage());
                                }
                            }
                        }
                    }
                }
            }
            log.info("Completed physical file cleanup sequence for deleted intern {}", user.getId());
        } catch (Exception e) {
            log.error("Error during physical file cleanup sequence for deleted intern {}: {}", user.getId(), e.getMessage(), e);
        }
    }

    @Transactional
    public InternProfileResponse updateWorkSchedule(UUID userId, com.internportal.backend.dto.request.WorkScheduleUpdateDto dto) {
        InternProfile profile = internProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new CustomException("Intern profile not found for user ID: " + userId, HttpStatus.NOT_FOUND));

        profile.setRequiredDailyHours(dto.getRequiredDailyHours());
        InternProfile saved = internProfileRepository.save(profile);

        notificationService.createNotificationForUser(
                profile.getUser(),
                "Working Hours Updated",
                "Your required daily working hours have been updated to " + dto.getRequiredDailyHours() + " hours.",
                "SCHEDULE"
        );

        return entityMapper.toInternProfileResponse(saved);
    }

    @Transactional
    public AdminAccountResponse createAdmin(AdminCreationRequest request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase();
        
        // Consume OTP verification
        otpService.consumeVerifiedOtp(normalizedEmail, OtpPurpose.ADMIN_CREATION);

        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new CustomException("Email is already registered!", HttpStatus.BAD_REQUEST);
        }

        Role adminRole = roleRepository.findByName(RoleType.ADMIN)
                .orElseThrow(() -> new CustomException("ADMIN role not found", HttpStatus.INTERNAL_SERVER_ERROR));

        User user = User.builder()
                .email(normalizedEmail)
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .status(AccountStatus.ACTIVE)
                .role(adminRole)
                .deleted(false)
                .fullName(request.getFullName())
                .build();

        User savedUser = userRepository.save(user);

        return AdminAccountResponse.builder()
                .id(savedUser.getId())
                .fullName(savedUser.getFullName())
                .email(savedUser.getEmail())
                .status(savedUser.getStatus())
                .createdAt(savedUser.getCreatedAt())
                .build();
    }

    @Transactional(readOnly = true)
    public List<AdminAccountResponse> getAllAdmins() {
        Role adminRole = roleRepository.findByName(RoleType.ADMIN)
                .orElseThrow(() -> new CustomException("ADMIN role not found", HttpStatus.INTERNAL_SERVER_ERROR));

        Specification<User> spec = (root, query, cb) -> cb.and(
                cb.equal(root.get("role"), adminRole),
                cb.equal(root.get("deleted"), false)
        );

        return userRepository.findAll(spec).stream()
                .map(user -> AdminAccountResponse.builder()
                        .id(user.getId())
                        .fullName(user.getFullName() != null ? user.getFullName() : "Batch Manager")
                        .email(user.getEmail())
                        .status(user.getStatus())
                        .createdAt(user.getCreatedAt())
                        .build())
                .toList();
    }

    @Transactional
    public AdminAccountResponse disableAdminAccount(UUID id, UUID currentAdminId) {
        if (id.equals(currentAdminId)) {
            throw new CustomException("Administrators cannot disable their own account.", HttpStatus.BAD_REQUEST);
        }

        User user = userRepository.findById(id)
                .orElseThrow(() -> new CustomException("Admin not found with ID: " + id, HttpStatus.NOT_FOUND));

        if (user.getRole().getName() != RoleType.ADMIN) {
            throw new CustomException("Target user is not an Admin", HttpStatus.BAD_REQUEST);
        }

        if (user.getStatus() == AccountStatus.DISABLED) {
            throw new CustomException("Admin is already disabled", HttpStatus.BAD_REQUEST);
        }

        Role adminRole = roleRepository.findByName(RoleType.ADMIN)
                .orElseThrow(() -> new CustomException("ADMIN role not found", HttpStatus.INTERNAL_SERVER_ERROR));

        long activeAdmins = userRepository.countByRoleAndStatusAndDeletedFalse(adminRole, AccountStatus.ACTIVE);
        if (activeAdmins <= 1) {
            throw new CustomException("Cannot disable the last active administrator.", HttpStatus.BAD_REQUEST);
        }

        user.setStatus(AccountStatus.DISABLED);
        userRepository.save(user);
        refreshTokenRepository.deleteByUser(user);

        return AdminAccountResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName() != null ? user.getFullName() : "Batch Manager")
                .email(user.getEmail())
                .status(user.getStatus())
                .createdAt(user.getCreatedAt())
                .build();
    }

    @Transactional
    public AdminAccountResponse enableAdminAccount(UUID id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new CustomException("Admin not found with ID: " + id, HttpStatus.NOT_FOUND));

        if (user.getRole().getName() != RoleType.ADMIN) {
            throw new CustomException("Target user is not an Admin", HttpStatus.BAD_REQUEST);
        }

        if (user.getStatus() != AccountStatus.DISABLED) {
            throw new CustomException("Only disabled accounts can be enabled", HttpStatus.BAD_REQUEST);
        }

        user.setStatus(AccountStatus.ACTIVE);
        userRepository.save(user);

        return AdminAccountResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName() != null ? user.getFullName() : "Batch Manager")
                .email(user.getEmail())
                .status(user.getStatus())
                .createdAt(user.getCreatedAt())
                .build();
    }

    @Transactional
    public AdminAccountResponse deleteAdminAccount(UUID id, UUID currentAdminId) {
        if (id.equals(currentAdminId)) {
            throw new CustomException("Administrators cannot delete their own account.", HttpStatus.BAD_REQUEST);
        }

        User user = userRepository.findById(id)
                .orElseThrow(() -> new CustomException("Admin not found with ID: " + id, HttpStatus.NOT_FOUND));

        if (user.getRole().getName() != RoleType.ADMIN) {
            throw new CustomException("Target user is not an Admin", HttpStatus.BAD_REQUEST);
        }

        if (user.isDeleted()) {
            throw new CustomException("Admin is already deleted", HttpStatus.BAD_REQUEST);
        }

        Role adminRole = roleRepository.findByName(RoleType.ADMIN)
                .orElseThrow(() -> new CustomException("ADMIN role not found", HttpStatus.INTERNAL_SERVER_ERROR));

        long activeAdmins = userRepository.countByRoleAndStatusAndDeletedFalse(adminRole, AccountStatus.ACTIVE);
        // If they are active, deleting them reduces the count. If they are disabled, deleting them doesn't affect active count.
        if (user.getStatus() == AccountStatus.ACTIVE && activeAdmins <= 1) {
            throw new CustomException("Cannot delete the last active administrator.", HttpStatus.BAD_REQUEST);
        }

        user.setDeleted(true);
        user.setStatus(AccountStatus.DISABLED);
        user.setEmail(user.getEmail() + "_deleted_" + UUID.randomUUID().toString());
        userRepository.save(user);
        refreshTokenRepository.deleteByUser(user);

        return AdminAccountResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName() != null ? user.getFullName() : "Batch Manager")
                .email(user.getEmail())
                .status(user.getStatus())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
