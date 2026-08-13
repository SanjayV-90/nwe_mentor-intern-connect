import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useAdminWorkspace } from '@/context/AdminWorkspaceContext';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  CalendarCheck,
  Code2,
  CheckSquare,
  Flame,
  UserCheck,
  Search,
  Users,
  Code,
  CalendarDays,
  LayoutDashboard,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (user?.role === 'ADMIN') {
    return <AdminSidebar />;
  }

  const internLinks = [
    { to: '/intern/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/intern/attendance', icon: CalendarCheck, label: 'Attendance Check-In' },
    { to: '/intern/leaves', icon: CalendarDays, label: 'Leave Requests' },
    { to: '/intern/assignments', icon: Code2, label: 'Coding Assignments' },
    { to: '/intern/tasks', icon: CheckSquare, label: 'Tasks' },
    { to: '/intern/duolingo', icon: Flame, label: 'Duolingo Streak Log' },
    { to: '/intern/profile', icon: UserCheck, label: 'My Profile & Tech Stack' },
  ];

  return (
    <aside className="w-64 shrink-0 border-r border-border-default bg-bg-sidebar p-4 min-h-[calc(100vh-4rem)] flex flex-col justify-between">
      <div>
        <div className="mb-4 px-3 text-xs font-semibold uppercase tracking-wider text-text-muted">
          Intern Workspace
        </div>
        <nav className="space-y-1.5">
          {internLinks.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center space-x-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-brand-primary/10 text-brand-primary border border-brand-primary/30 shadow-md'
                      : 'text-text-secondary hover:bg-bg-surface-elevated hover:text-text-primary'
                  }`
                }
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      <div className="mt-12 rounded-xl border border-border-default bg-bg-surface/60 p-4">
        <div className="flex items-center space-x-2 text-xs font-semibold text-brand-primary">
          <Flame className="h-4 w-4 text-warning" />
          <span>Learning Sprint</span>
        </div>
        <p className="mt-1.5 text-xs leading-relaxed text-text-secondary">
          Consistent task execution and problem solving drive high batch ratings.
        </p>
      </div>
    </aside>
  );
};

const AdminSidebar: React.FC = () => {
  const {
    filteredInterns,
    selectedIntern,
    setSelectedIntern,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    internsList,
    isLoading: internsLoading,
    isError: internsError,
  } = useAdminWorkspace();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSelectIntern = (intern: any) => {
    setSelectedIntern(intern);
    if (location.pathname !== '/admin/dashboard') {
      navigate('/admin/dashboard');
    }
  };

  return (
    <aside className="w-80 shrink-0 border-r border-border-default bg-bg-sidebar p-4 min-h-[calc(100vh-4rem)] flex flex-col gap-4">
      {/* Admin Home / Accounts Button */}
      <button
        onClick={() => {
          setSelectedIntern(null);
          if (location.pathname !== '/admin/dashboard') {
            navigate('/admin/dashboard');
          }
        }}
        className={`flex items-center gap-3 w-full p-3 rounded-xl border transition-all ${
          !selectedIntern && location.pathname === '/admin/dashboard'
            ? 'bg-brand-primary/10 border-brand-primary/50 text-brand-primary shadow-lg font-bold'
            : 'bg-bg-surface/50 border-border-default/60 text-text-secondary hover:bg-bg-surface hover:text-text-primary hover:border-border-default font-semibold'
        }`}
      >
        <LayoutDashboard className="h-4 w-4 shrink-0" />
        <span className="text-sm">Admin Home & Accounts</span>
      </button>

      <div className="h-px bg-border-subtle my-1 w-full" />

      {/* Sidebar Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-brand-primary" />
          <span className="text-xs font-extrabold uppercase tracking-widest text-text-primary">
            Interns Directory
          </span>
        </div>
        <Badge variant="outline" className="text-[10px] font-mono border-border-default text-text-secondary">
          {internsLoading ? '…' : internsError ? 'ERR' : `${internsList.length} total`}
        </Badge>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-text-muted" />
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search intern..."
          className="pl-8.5 h-9 bg-bg-input border-border-default text-xs text-text-primary placeholder:text-text-muted focus:border-brand-primary rounded-lg"
        />
      </div>

      {/* Filter Tabs */}
      <div className="grid grid-cols-3 gap-1 bg-bg-input p-1 rounded-lg border border-border-default">
        <button
          onClick={() => setStatusFilter('ALL')}
          className={`py-1 text-[10px] font-bold rounded-md transition-all ${
            statusFilter === 'ALL'
              ? 'bg-brand-primary text-bg-page font-bold shadow'
              : 'text-text-secondary hover:text-text-primary hover:bg-bg-surface-elevated'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setStatusFilter('ACTIVE')}
          className={`py-1 text-[10px] font-bold rounded-md transition-all ${
            statusFilter === 'ACTIVE'
              ? 'bg-brand-primary text-bg-page font-bold shadow'
              : 'text-text-secondary hover:text-text-primary hover:bg-bg-surface-elevated'
          }`}
        >
          Active
        </button>
        <button
          onClick={() => setStatusFilter('PENDING_APPROVAL')}
          className={`py-1 text-[10px] font-bold rounded-md transition-all ${
            statusFilter === 'PENDING_APPROVAL'
              ? 'bg-brand-primary text-bg-page font-bold shadow'
              : 'text-text-secondary hover:text-text-primary hover:bg-bg-surface-elevated'
          }`}
        >
          Pending
        </button>
      </div>

      {/* Scrollable Interns List */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1 -mr-1">
        {internsLoading ? (
          <div className="py-10 text-center text-xs text-text-muted">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-brand-primary mx-auto mb-2" />
            Loading interns...
          </div>
        ) : internsError ? (
          <div className="py-10 text-center text-xs text-rose-400 italic px-2">
            Failed to load intern directory. Check your connection and reload.
          </div>
        ) : !Array.isArray(filteredInterns) || filteredInterns.length === 0 ? (
          <div className="py-10 text-center text-xs text-text-muted italic">
            {internsList.length === 0 ? 'No interns registered yet.' : 'No interns match criteria.'}
          </div>
        ) : (
          filteredInterns.map((intern) => {
            if (!intern) return null;
            const isSelected = selectedIntern?.userId === intern.userId;
            const avatarChar = intern.fullName ? intern.fullName.charAt(0).toUpperCase() : 'I';
            return (
              <div
                key={intern.userId || intern.employeeId || intern.email || 'intern'}
                onClick={() => handleSelectIntern(intern)}
                className={`group cursor-pointer rounded-xl p-3 border transition-all ${
                  isSelected
                    ? 'bg-brand-primary/10 border-brand-primary/50 shadow-lg'
                    : 'bg-bg-surface/50 border-border-default/60 hover:bg-bg-surface hover:border-border-default'
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Profile Picture / Avatar */}
                  <div
                    className={`h-10 w-10 shrink-0 rounded-xl flex items-center justify-center font-black text-sm text-text-primary shadow overflow-hidden ${
                      isSelected
                        ? 'bg-brand-primary text-bg-page ring-2 ring-brand-primary-soft font-black'
                        : 'bg-bg-surface group-hover:bg-bg-surface-elevated'
                    }`}
                  >
                    {intern.profilePictureUrl ? (
                      <img
                        src={intern.profilePictureUrl}
                        alt="avatar"
                        className="h-full w-full object-cover"
                    />
                    ) : (
                      avatarChar
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className={`text-xs font-bold truncate ${isSelected ? 'text-text-primary' : 'text-text-secondary'}`}>
                        {intern.fullName || 'Unnamed Intern'}
                      </p>
                      <span
                        className={`h-2 w-2 rounded-full shrink-0 ${
                          intern.status === 'ACTIVE' ? 'bg-success' : 'bg-warning'
                        }`}
                        title={intern.status || 'UNKNOWN'}
                      />
                    </div>

                    <div className="flex items-center justify-end text-[10px] text-text-muted mt-0.5">
                      <span className="uppercase font-semibold tracking-wider text-[9px] text-text-muted">
                        {intern.status === 'ACTIVE' ? 'Active' : 'Pending'}
                      </span>
                    </div>

                    {/* Tech Stack Badge */}
                    <div className="mt-2 flex items-center gap-1">
                      <Code className="h-3 w-3 text-brand-primary shrink-0" />
                      <span className="text-[10px] font-medium text-text-secondary truncate">
                        {intern.primarySkill || (intern.currentTechStack ? intern.currentTechStack.split(',')[0] : 'Software Dev')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
};
