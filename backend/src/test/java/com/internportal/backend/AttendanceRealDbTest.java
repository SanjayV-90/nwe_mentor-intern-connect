package com.internportal.backend;

import com.internportal.backend.domain.entity.Attendance;
import com.internportal.backend.domain.entity.InternProfile;
import com.internportal.backend.domain.entity.LeaveRequest;
import com.internportal.backend.domain.entity.User;
import com.internportal.backend.domain.enums.AccountStatus;
import com.internportal.backend.domain.enums.AttendanceStatus;
import com.internportal.backend.domain.enums.LeaveStatus;
import com.internportal.backend.domain.enums.LeaveType;
import com.internportal.backend.domain.enums.RoleType;
import com.internportal.backend.repository.AttendanceRepository;
import com.internportal.backend.repository.InternProfileRepository;
import com.internportal.backend.repository.LeaveRequestRepository;
import com.internportal.backend.repository.UserRepository;
import com.internportal.backend.service.AttendanceService;
import com.internportal.backend.dto.response.AttendanceSummaryResponse;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;

import com.internportal.backend.domain.entity.Role;
import com.internportal.backend.repository.RoleRepository;

@SpringBootTest
public class AttendanceRealDbTest {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AttendanceRepository attendanceRepository;

    @Autowired
    private InternProfileRepository internProfileRepository;

    @Autowired
    private LeaveRequestRepository leaveRequestRepository;

    @Autowired
    private AttendanceService attendanceService;
    
    @Autowired
    private RoleRepository roleRepository;

    @Test
    @Transactional
    public void testA4_And_A5() {
        // Create fresh intern
        User intern = new User();
        intern.setEmail("test_a4a5_" + System.currentTimeMillis() + "@portal.com");
        intern.setPasswordHash("password");
        Role role = roleRepository.findByName(RoleType.INTERN).orElse(null);
        intern.setRole(role);
        intern.setStatus(AccountStatus.ACTIVE);
        intern = userRepository.save(intern);

        InternProfile profile = new InternProfile();
        profile.setUser(intern);
        profile.setFullName("Test Intern A4 A5");
        profile.setJoiningDate(LocalDate.now());
        profile.setRequiredDailyHours(8.0);
        profile = internProfileRepository.save(profile);
        intern.setInternProfile(profile);
        
        // A4: Completed PRESENT today
        Attendance att = new Attendance();
        att.setIntern(intern);
        att.setAttendanceDate(LocalDate.now());
        att.setCheckInTime(LocalDateTime.now().minusHours(9));
        att.setCheckOutTime(LocalDateTime.now());
        att.setStatus(AttendanceStatus.PRESENT);
        att.setWorkingHours("9h 0m");
        attendanceRepository.save(att);

        AttendanceSummaryResponse summaryA4 = attendanceService.getAttendanceSummary(intern.getId());
        
        System.out.println("A4 Test Summary: " + summaryA4);
        assertEquals(1, summaryA4.getTotalWorkingDays());
        assertEquals(1, summaryA4.getPresentDays());
        assertEquals(0, summaryA4.getAbsentDays());
        
        // Clean up attendance for A5
        attendanceRepository.deleteAll();

        // A5: Approved Leave Today
        LeaveRequest leave = new LeaveRequest();
        leave.setIntern(intern);
        leave.setLeaveType(LeaveType.CASUAL);
        leave.setStartDate(LocalDate.now());
        leave.setEndDate(LocalDate.now());
        leave.setStatus(LeaveStatus.APPROVED);
        leave.setReason("Test");
        leaveRequestRepository.save(leave);

        AttendanceSummaryResponse summaryA5 = attendanceService.getAttendanceSummary(intern.getId());
        
        System.out.println("A5 Test Summary: " + summaryA5);
        assertEquals(1, summaryA5.getTotalWorkingDays());
        assertEquals(0, summaryA5.getPresentDays());
        assertEquals(1, summaryA5.getApprovedLeaveDays());
    }
}
