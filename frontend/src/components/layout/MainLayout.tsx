import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { AdminWorkspaceProvider } from '@/context/AdminWorkspaceContext';

interface MainLayoutProps {
  requiredRole?: 'ADMIN' | 'INTERN';
}

export const MainLayout: React.FC<MainLayoutProps> = ({ requiredRole }) => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-bg-page p-6 text-center text-text-primary">
        <h1 className="text-3xl font-extrabold text-danger">403 Forbidden</h1>
        <p className="mt-2 text-text-secondary">
          You do not have permission to access the {requiredRole} portal workspace.
        </p>
        <button
          onClick={() => window.history.back()}
          className="mt-6 rounded-lg bg-brand-primary px-6 py-2.5 font-bold text-bg-page shadow-lg hover:bg-brand-primary-hover transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  const content = (
    <div className="min-h-screen bg-bg-page text-text-primary flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        <ErrorBoundary fallbackTitle="Sidebar Rendering Error">
          <Sidebar />
        </ErrorBoundary>
        <main className="flex-1 overflow-y-auto p-6 max-w-[1600px] mx-auto w-full">
          <ErrorBoundary fallbackTitle="Dashboard Workspace Error">
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );

  if (user.role === 'ADMIN') {
    return (
      <ErrorBoundary fallbackTitle="Admin Workspace Initialization Error">
        <AdminWorkspaceProvider>{content}</AdminWorkspaceProvider>
      </ErrorBoundary>
    );
  }

  return content;
};
