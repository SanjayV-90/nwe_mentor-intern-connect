package com.internportal.backend.service;

import com.internportal.backend.domain.entity.Attendance;
import com.internportal.backend.domain.entity.User;
import com.internportal.backend.domain.enums.AttendanceStatus;
import com.internportal.backend.dto.request.AttendanceCheckInRequest;
import com.internportal.backend.dto.response.AttendanceResponse;
import com.internportal.backend.exception.CustomException;
import com.internportal.backend.mapper.EntityMapper;
import com.internportal.backend.repository.AttendanceRepository;
import com.internportal.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AttendanceService {

    private final AttendanceRepository attendanceRepository;
    private final UserRepository userRepository;
    private final EntityMapper entityMapper;
    private final NotificationService notificationService;
    private final AttendanceClassificationService classificationService;
    private final BusinessCalendarService businessCalendarService;

    @Transactional
    public AttendanceResponse checkIn(UUID internId, AttendanceCheckInRequest request) {
        LocalDate today = LocalDate.now();
        if (attendanceRepository.findByInternIdAndAttendanceDate(internId, today).isPresent()) {
            throw new CustomException("Attendance already marked for today!", HttpStatus.BAD_REQUEST);
        }

        User intern = userRepository.findById(internId)
                .orElseThrow(() -> new CustomException("User not found", HttpStatus.NOT_FOUND));

        LocalDateTime now = LocalDateTime.now();
        Attendance attendance = Attendance.builder()
                .intern(intern)
                .attendanceDate(today)
                .loginTime(now)
                .checkInTime(now)
                .workingHours("In Progress")
                .status(request.getStatus() != null ? request.getStatus() : AttendanceStatus.PRESENT)
                .remarks(request.getRemarks())
                .build();

        Attendance saved = attendanceRepository.save(attendance);
        String internName = intern.getInternProfile() != null ? intern.getInternProfile().getFullName() : intern.getEmail();
        notificationService.createNotificationForAdmins("Attendance Check-In", internName + " marked attendance check-in.", "ATTENDANCE");
        return entityMapper.toAttendanceResponse(saved);
    }

    @Transactional
    public AttendanceResponse checkOut(UUID internId) {
        LocalDate today = LocalDate.now();
        Attendance attendance = attendanceRepository.findByInternIdAndAttendanceDate(internId, today)
                .orElseThrow(() -> new CustomException("No attendance check-in found for today. Please check in first.", HttpStatus.BAD_REQUEST));

        if (attendance.getCheckOutTime() != null || attendance.getLogoutTime() != null) {
            throw new CustomException("Attendance check-out has already been recorded for today.", HttpStatus.BAD_REQUEST);
        }

        LocalDateTime now = LocalDateTime.now();
        attendance.setLogoutTime(now);
        attendance.setCheckOutTime(now);

        LocalDateTime start = attendance.getCheckInTime() != null ? attendance.getCheckInTime() : attendance.getLoginTime();
        if (start == null) {
            start = now;
        }

        AttendanceClassificationService.ClassificationResult result = classificationService.classify(
                attendance.getIntern().getInternProfile(),
                start,
                now
        );

        attendance.setWorkingHours(result.getWorkingHoursString());
        attendance.setStatus(result.getStatus());

        Attendance saved = attendanceRepository.save(attendance);
        return entityMapper.toAttendanceResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<AttendanceResponse> getInternAttendanceHistory(UUID internId) {
        return attendanceRepository.findByInternIdOrderByAttendanceDateDesc(internId).stream()
                .map(entityMapper::toAttendanceResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AttendanceResponse> getAllAttendanceRecords() {
        return attendanceRepository.findAll().stream()
                .map(entityMapper::toAttendanceResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public com.internportal.backend.dto.response.AttendanceSummaryResponse getAttendanceSummary(UUID internId) {
        User intern = userRepository.findById(internId)
                .orElseThrow(() -> new CustomException("User not found", HttpStatus.NOT_FOUND));

        List<Attendance> records = attendanceRepository.findByInternIdOrderByAttendanceDateDesc(internId);
        long presentDays = records.stream().filter(a -> a.getStatus() == AttendanceStatus.PRESENT && (a.getCheckOutTime() != null || a.getLogoutTime() != null)).count();
        long halfDays = records.stream().filter(a -> a.getStatus() == AttendanceStatus.HALF_DAY && (a.getCheckOutTime() != null || a.getLogoutTime() != null)).count();

        LocalDate startDate = LocalDate.now();
        if (intern.getInternProfile() != null && intern.getInternProfile().getJoiningDate() != null) {
            startDate = intern.getInternProfile().getJoiningDate();
        } else if (!records.isEmpty()) {
            startDate = records.get(records.size() - 1).getAttendanceDate();
        } else if (intern.getUpdatedAt() != null) {
            startDate = intern.getUpdatedAt().toLocalDate();
        } else if (intern.getCreatedAt() != null) {
            startDate = intern.getCreatedAt().toLocalDate();
        }

        LocalDate today = LocalDate.now();
        long expectedWorkingDays = 0;
        
        if (!startDate.isAfter(today.minusDays(1))) {
            expectedWorkingDays = businessCalendarService.calculateWorkingDays(startDate, today.minusDays(1));
        }

        boolean hasCompletedRecordToday = records.stream()
                .anyMatch(a -> a.getAttendanceDate().equals(today) && 
                               (a.getCheckOutTime() != null || a.getLogoutTime() != null));
                               
        long approvedLeaveDaysToday = businessCalendarService.calculateApprovedLeaveDays(internId, today, today);
        boolean hasLeaveToday = approvedLeaveDaysToday > 0;

        if (hasCompletedRecordToday || hasLeaveToday) {
            expectedWorkingDays += businessCalendarService.calculateWorkingDays(today, today);
        }

        long totalWorkingDays = expectedWorkingDays;
        
        long completedRecords = records.stream().filter(a -> a.getCheckOutTime() != null || a.getLogoutTime() != null).count();
        if (totalWorkingDays < completedRecords) {
            totalWorkingDays = completedRecords;
        }

        long approvedLeaveDays = businessCalendarService.calculateApprovedLeaveDays(internId, startDate, today);
        long absentDays = Math.max(0, totalWorkingDays - presentDays - halfDays - approvedLeaveDays);

        long eligibleDays = Math.max(1, totalWorkingDays - approvedLeaveDays);
        double attendanceRate = Math.round(((double) (presentDays + (0.5 * halfDays)) / eligibleDays) * 1000.0) / 10.0;
        if (attendanceRate > 100.0) {
            attendanceRate = 100.0;
        }

        return com.internportal.backend.dto.response.AttendanceSummaryResponse.builder()
                .totalWorkingDays(totalWorkingDays)
                .presentDays(presentDays)
                .halfDays(halfDays)
                .absentDays(absentDays)
                .approvedLeaveDays(approvedLeaveDays)
                .attendanceRate(attendanceRate)
                .build();
    }
}
