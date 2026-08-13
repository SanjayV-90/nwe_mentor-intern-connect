package com.internportal.backend.config;

import com.internportal.backend.domain.entity.*;
import com.internportal.backend.domain.enums.*;
import com.internportal.backend.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Configuration
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final InternProfileRepository internProfileRepository;
    private final AttendanceRepository attendanceRepository;
    private final AssignmentRepository assignmentRepository;
    private final DuolingoRepository duolingoRepository;
    private final DailyTaskRepository dailyTaskRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        log.info("Initializing system seed data if database is empty...");

        Role adminRole = roleRepository.findByName(RoleType.ADMIN).orElseGet(() ->
                roleRepository.save(Role.builder().name(RoleType.ADMIN).description("System Batch Manager").build()));

        Role internRole = roleRepository.findByName(RoleType.INTERN).orElseGet(() ->
                roleRepository.save(Role.builder().name(RoleType.INTERN).description("Intern Engineer").build()));

        if (userRepository.countByRole(adminRole) == 0) {
            User admin = User.builder()
                    .email("admin@portal.com")
                    .passwordHash(passwordEncoder.encode("Admin@12345"))
                    .status(AccountStatus.ACTIVE)
                    .role(adminRole)
                    .deleted(false)
                    .build();
            userRepository.save(admin);
            log.info("Seeded Admin Account: admin@portal.com / Admin@12345");
        }


    }
}
