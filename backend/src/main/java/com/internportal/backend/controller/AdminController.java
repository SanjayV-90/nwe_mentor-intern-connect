package com.internportal.backend.controller;

import com.internportal.backend.domain.enums.AccountStatus;
import com.internportal.backend.dto.request.*;
import com.internportal.backend.dto.response.*;
import com.internportal.backend.security.CustomUserDetails;
import com.internportal.backend.service.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
@Tag(name = "Admin API", description = "Endpoints for Batch Manager (Intern approval, attendance monitoring, analytics)")
public class AdminController {

    private final AdminService adminService;
    private final AnalyticsService analyticsService;
    private final AttendanceService attendanceService;
    private final AssignmentService assignmentService;
    private final DuolingoService duolingoService;
    private final TaskService taskService;

    @GetMapping("/interns")
    @Operation(summary = "Get paginated & filtered list of interns")
    public ResponseEntity<ApiResponse<Page<InternProfileResponse>>> getInterns(
            @RequestParam(required = false) AccountStatus status,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<InternProfileResponse> interns = adminService.getAllInterns(status, search, PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")));
        return ResponseEntity.ok(ApiResponse.success("Interns fetched successfully", interns));
    }

    @GetMapping("/interns/{id}")
    @Operation(summary = "Get detailed intern profile")
    public ResponseEntity<ApiResponse<InternProfileResponse>> getInternDetails(
            @PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success("Intern profile fetched", adminService.getInternById(id)));
    }

    @GetMapping("/interns/{id}/assignments")
    @Operation(summary = "Get problem submissions for a specific intern")
    public ResponseEntity<ApiResponse<List<AssignmentResponse>>> getInternAssignments(
            @PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success("Intern problem submissions fetched", assignmentService.getInternAssignmentsForManagerOrMentor(id)));
    }

    @GetMapping("/interns/{id}/attendance")
    @Operation(summary = "Get attendance for a specific intern")
    public ResponseEntity<ApiResponse<List<AttendanceResponse>>> getInternAttendance(
            @PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success("Intern attendance fetched", attendanceService.getInternAttendanceHistory(id)));
    }

    @GetMapping("/interns/{id}/attendance-summary")
    @Operation(summary = "Get attendance summary statistics for a specific intern")
    public ResponseEntity<ApiResponse<AttendanceSummaryResponse>> getInternAttendanceSummary(
            @PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success("Intern attendance summary fetched", attendanceService.getAttendanceSummary(id)));
    }

    @GetMapping("/interns/{id}/tasks")
    @Operation(summary = "Get tasks for a specific intern")
    public ResponseEntity<ApiResponse<List<TaskResponse>>> getInternTasks(
            @PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success("Intern tasks fetched", taskService.getMyTasks(id)));
    }

    @GetMapping("/interns/{id}/duolingo")
    @Operation(summary = "Get Duolingo updates for a specific intern")
    public ResponseEntity<ApiResponse<List<DuolingoResponse>>> getInternDuolingo(
            @PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success("Intern Duolingo logs fetched", duolingoService.getMyDuolingoHistory(id)));
    }

    @PatchMapping("/interns/{id}/approve")
    @Operation(summary = "Approve newly registered intern account")
    public ResponseEntity<ApiResponse<InternProfileResponse>> approveIntern(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success("Intern account approved and activated", adminService.approveIntern(id)));
    }

    @PatchMapping("/interns/{id}/reject")
    @Operation(summary = "Reject intern registration")
    public ResponseEntity<ApiResponse<InternProfileResponse>> rejectIntern(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success("Intern account rejected", adminService.rejectIntern(id)));
    }

    @PatchMapping("/interns/{id}/disable")
    @Operation(summary = "Disable active intern account")
    public ResponseEntity<ApiResponse<InternProfileResponse>> disableIntern(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success("Intern account disabled", adminService.disableIntern(id)));
    }

    @PatchMapping("/interns/{id}/enable")
    @Operation(summary = "Enable temporarily disabled intern account")
    public ResponseEntity<ApiResponse<InternProfileResponse>> enableIntern(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success("Intern account enabled", adminService.enableIntern(id)));
    }

    @DeleteMapping("/interns/{id}")
    @Operation(summary = "Safe delete intern account and associated physical files")
    public ResponseEntity<ApiResponse<InternProfileResponse>> deleteIntern(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success("Intern account safely deleted and files removed", adminService.deleteIntern(id)));
    }

    @PutMapping("/interns/{id}/work-schedule")
    @Operation(summary = "Update required daily working hours for an intern")
    public ResponseEntity<ApiResponse<InternProfileResponse>> updateWorkSchedule(
            @PathVariable UUID id,
            @Valid @RequestBody WorkScheduleUpdateDto dto) {
        return ResponseEntity.ok(ApiResponse.success("Work schedule updated successfully", adminService.updateWorkSchedule(id, dto)));
    }

    @GetMapping("/analytics/dashboard")
    @Operation(summary = "Get comprehensive dashboard analytics & Recharts dataset")
    public ResponseEntity<ApiResponse<AdminDashboardAnalyticsResponse>> getDashboardAnalytics() {
        return ResponseEntity.ok(ApiResponse.success("Dashboard analytics fetched", analyticsService.getDashboardAnalytics()));
    }

    @GetMapping("/attendance")
    @Operation(summary = "View all interns' attendance records")
    public ResponseEntity<ApiResponse<List<AttendanceResponse>>> getAllAttendance() {
        return ResponseEntity.ok(ApiResponse.success("All attendance records fetched", attendanceService.getAllAttendanceRecords()));
    }

    @GetMapping("/assignments")
    @Operation(summary = "View all interns' problem submissions")
    public ResponseEntity<ApiResponse<List<AssignmentResponse>>> getAllAssignments() {
        return ResponseEntity.ok(ApiResponse.success("All problem submissions fetched", assignmentService.getAllAssignments()));
    }

    @GetMapping("/duolingo")
    @Operation(summary = "View all interns' Duolingo streak updates")
    public ResponseEntity<ApiResponse<List<DuolingoResponse>>> getAllDuolingo() {
        return ResponseEntity.ok(ApiResponse.success("All Duolingo logs fetched", duolingoService.getAllDuolingoUpdates()));
    }

    @GetMapping("/tasks")
    @Operation(summary = "View all daily tasks across batch")
    public ResponseEntity<ApiResponse<List<TaskResponse>>> getAllTasks() {
        return ResponseEntity.ok(ApiResponse.success("All tasks fetched", taskService.getAllTasks()));
    }

    @PatchMapping("/assignments/{id}/approve")
    @Operation(summary = "Approve assignment submission")
    public ResponseEntity<ApiResponse<AssignmentResponse>> approveAssignment(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success("Assignment approved", assignmentService.approveAssignment(id)));
    }

    @PatchMapping("/assignments/{id}/reject")
    @Operation(summary = "Reject assignment submission")
    public ResponseEntity<ApiResponse<AssignmentResponse>> rejectAssignment(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success("Assignment rejected", assignmentService.rejectAssignment(id)));
    }

    @PostMapping("/accounts")
    @Operation(summary = "Create a new Admin account")
    public ResponseEntity<ApiResponse<AdminAccountResponse>> createAdminAccount(@Valid @RequestBody AdminCreationRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Admin account created successfully", adminService.createAdmin(request)));
    }

    @GetMapping("/accounts")
    @Operation(summary = "Get list of all Admin accounts")
    public ResponseEntity<ApiResponse<List<AdminAccountResponse>>> getAllAdmins() {
        return ResponseEntity.ok(ApiResponse.success("Admin accounts fetched successfully", adminService.getAllAdmins()));
    }

    @PutMapping("/accounts/{id}/disable")
    @Operation(summary = "Disable an Admin account")
    public ResponseEntity<ApiResponse<AdminAccountResponse>> disableAdminAccount(
            @PathVariable UUID id,
            @org.springframework.security.core.annotation.AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.success("Admin account disabled successfully", adminService.disableAdminAccount(id, userDetails.getId())));
    }

    @PutMapping("/accounts/{id}/enable")
    @Operation(summary = "Enable a disabled Admin account")
    public ResponseEntity<ApiResponse<AdminAccountResponse>> enableAdminAccount(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success("Admin account enabled successfully", adminService.enableAdminAccount(id)));
    }

    @DeleteMapping("/accounts/{id}")
    @Operation(summary = "Delete an Admin account")
    public ResponseEntity<ApiResponse<AdminAccountResponse>> deleteAdminAccount(
            @PathVariable UUID id,
            @org.springframework.security.core.annotation.AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.success("Admin account deleted successfully", adminService.deleteAdminAccount(id, userDetails.getId())));
    }
}
