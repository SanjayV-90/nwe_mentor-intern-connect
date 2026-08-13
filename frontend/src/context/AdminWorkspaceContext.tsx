import React, { createContext, useContext, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuth } from './AuthContext';

export interface InternProfile {
  userId: string;
  profileId: string;
  employeeId: string;
  email: string;
  status: 'ACTIVE' | 'PENDING_APPROVAL' | 'REJECTED' | 'DISABLED';
  fullName: string;
  phone?: string;
  address?: string;
  college?: string;
  degree?: string;
  department?: string;
  joiningDate?: string;
  expectedEndDate?: string;
  currentTechStack?: string;
  primarySkill?: string;
  secondarySkill?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  profilePictureUrl?: string;
  resumeUrl?: string;
  resumeFileName?: string;
  resumeUploadedAt?: string;
  requiredDailyHours?: number;
}

interface AdminWorkspaceContextType {
  internsList: InternProfile[];
  isLoading: boolean;
  isError: boolean;
  selectedIntern: InternProfile | null;
  setSelectedIntern: (intern: InternProfile | null) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  statusFilter: 'ALL' | 'ACTIVE' | 'PENDING_APPROVAL' | 'DISABLED';
  setStatusFilter: (status: 'ALL' | 'ACTIVE' | 'PENDING_APPROVAL' | 'DISABLED') => void;
  filteredInterns: InternProfile[];
}

const AdminWorkspaceContext = createContext<AdminWorkspaceContextType | undefined>(undefined);

export const AdminWorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [selectedIntern, setSelectedIntern] = useState<InternProfile | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'PENDING_APPROVAL' | 'DISABLED'>('ALL');

  // Include user.userId in the query key so each user session has its own cache entry.
  // Do NOT catch errors here — let TanStack Query track isError correctly so the UI
  // can distinguish between a network failure and a genuine empty list.
  const { data: rawList, isLoading, isError } = useQuery<InternProfile[]>({
    queryKey: ['adminWorkspaceInterns', user?.userId],
    queryFn: async () => {
      const res = await api.get('/admin/interns?size=100');
      const payload = res.data?.data;
      if (Array.isArray(payload)) return payload;
      if (Array.isArray(payload?.content)) return payload.content;
      return [];
    },
    enabled: user?.role === 'ADMIN' && !!user?.userId,
    refetchInterval: 15000,
    staleTime: 5000,
  });

  const internsList: InternProfile[] = Array.isArray(rawList) ? rawList : [];

  // Synchronize selectedIntern with the loaded intern list:
  // - On fresh load (selectedIntern is null): auto-select first ACTIVE intern.
  // - On refresh (selectedIntern is set): keep it if it's still in the list; otherwise
  //   select the first ACTIVE intern (covers the case where a stale intern was set
  //   from a previous session or before the list loaded).
  // - If list is loaded successfully and is genuinely empty: clear selectedIntern.
  useEffect(() => {
    // Do not run while loading — wait for a definitive result.
    if (isLoading) return;
    // If the query errored, leave selectedIntern as-is; the UI will show an error state.
    if (isError) return;

    if (internsList.length === 0) {
      // Genuinely empty list — clear any stale selection.
      setSelectedIntern(null);
      return;
    }

    if (selectedIntern) {
      // Already have a selection — verify it's still in the current list.
      const updated = internsList.find((i) => i && i.userId === selectedIntern.userId);
      if (updated) {
        // Refresh the intern data in case profile was updated.
        setSelectedIntern(updated);
      } else {
        // Stale intern (no longer in list) — clear selection.
        setSelectedIntern(null);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [internsList, isLoading, isError]);

  const filteredInterns = internsList.filter((intern) => {
    if (!intern) return false;
    const name = intern.fullName || '';
    const email = intern.email || '';
    const empId = intern.employeeId || '';
    const skill = intern.primarySkill || '';
    const tech = intern.currentTechStack || '';

    const q = (searchTerm || '').toLowerCase();
    const matchesSearch =
      name.toLowerCase().includes(q) ||
      email.toLowerCase().includes(q) ||
      empId.toLowerCase().includes(q) ||
      skill.toLowerCase().includes(q) ||
      tech.toLowerCase().includes(q);

    if (!matchesSearch) return false;
    if (statusFilter !== 'ALL' && intern.status !== statusFilter) return false;
    return true;
  });

  return (
    <AdminWorkspaceContext.Provider
      value={{
        internsList,
        isLoading,
        isError,
        selectedIntern,
        setSelectedIntern,
        searchTerm,
        setSearchTerm,
        statusFilter,
        setStatusFilter,
        filteredInterns,
      }}
    >
      {children}
    </AdminWorkspaceContext.Provider>
  );
};

export const useAdminWorkspace = () => {
  const context = useContext(AdminWorkspaceContext);
  if (!context) {
    throw new Error('useAdminWorkspace must be used within an AdminWorkspaceProvider');
  }
  return context;
};
