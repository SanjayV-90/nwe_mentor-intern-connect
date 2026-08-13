import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { AuthProvider } from '@/context/AuthContext';
import { MainLayout } from '@/components/layout/MainLayout';

// Auth pages
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';

// Admin pages
import { AdminDashboard } from '@/pages/admin/AdminDashboard';
import { AdminInternsPage } from '@/pages/admin/AdminInternsPage';
import { AdminAttendancePage } from '@/pages/admin/AdminAttendancePage';
import { AdminAssignmentsPage } from '@/pages/admin/AdminAssignmentsPage';
import { AdminTasksPage } from '@/pages/admin/AdminTasksPage';
import { AdminDuolingoPage } from '@/pages/admin/AdminDuolingoPage';

// Intern pages
import { InternDashboardPage } from '@/pages/intern/InternDashboardPage';
import { InternProfilePage } from '@/pages/intern/InternProfilePage';
import { InternAttendancePage } from '@/pages/intern/InternAttendancePage';
import { InternAssignmentsPage } from '@/pages/intern/InternAssignmentsPage';
import { InternTasksPage } from '@/pages/intern/InternTasksPage';
import { InternDuolingoPage } from '@/pages/intern/InternDuolingoPage';
import { InternLeavesPage } from '@/pages/intern/InternLeavesPage';

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Admin Portal Workspace - Single Screen Intern Context */}
            <Route path="/admin" element={<MainLayout requiredRole="ADMIN" />}>
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="interns" element={<AdminDashboard />} />
              <Route path="attendance" element={<AdminDashboard />} />
              <Route path="assignments" element={<AdminDashboard />} />
              <Route path="tasks" element={<AdminDashboard />} />
              <Route path="duolingo" element={<AdminDashboard />} />
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
            </Route>

            {/* Intern Portal Workspace */}
            <Route path="/intern" element={<MainLayout requiredRole="INTERN" />}>
              <Route path="dashboard" element={<InternDashboardPage />} />
              <Route path="profile" element={<InternProfilePage />} />
              <Route path="attendance" element={<InternAttendancePage />} />
              <Route path="leaves" element={<InternLeavesPage />} />
              <Route path="assignments" element={<InternAssignmentsPage />} />
              <Route path="tasks" element={<InternTasksPage />} />
              <Route path="duolingo" element={<InternDuolingoPage />} />
              <Route index element={<Navigate to="/intern/dashboard" replace />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
