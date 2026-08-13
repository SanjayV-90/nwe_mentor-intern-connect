import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { LogOut, Bell, Shield, User as UserIcon, Check, CheckCheck, Sun, Moon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useTheme } from '@/context/ThemeContext';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
}

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const [showNotifs, setShowNotifs] = useState(false);
  const notifRef = React.useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const { theme, setTheme, actualTheme } = useTheme();

  const toggleTheme = () => setTheme(actualTheme === 'dark' ? 'light' : 'dark');

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifs(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowNotifs(false);
      }
    };
    if (showNotifs) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showNotifs]);

  const { data: notifications = [], isLoading: notifsLoading, isError: notifsError } = useQuery<NotificationItem[]>({
    queryKey: ['notifications', user?.userId],
    queryFn: async () => {
      const res = await api.get('/notifications');
      return res.data.data || [];
    },
    enabled: !!user,
    refetchInterval: 10000,
  });

  const markReadMutation = useMutation({
    mutationFn: async (id: string) => api.patch(`/notifications/${id}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.userId] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => api.patch('/notifications/read-all'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.userId] });
    },
  });

  const unreadCount = notifications.filter((n) => !n.read).length;
  const avatarUrl = user?.profilePictureUrl;

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-border-default bg-bg-navbar/90 px-6 backdrop-blur-md transition-colors">
      <div className="flex items-center space-x-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-bg-surface border border-border-default shadow overflow-hidden shrink-0">
          <img src="/logo.jpg" alt="MentorBridge Logo" className="h-full w-full object-cover" />
        </div>
        <div>
          <span className="text-lg font-bold tracking-tight text-text-primary">
            Mentor<span className="text-brand-primary">Bridge</span>
          </span>
          <p className="text-[11px] font-medium tracking-wide text-text-muted">
            ENTERPRISE LEARNING PORTAL
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        {user && (
          <Badge variant={user.role === 'ADMIN' ? 'purple' : 'default'} className="px-3 py-1">
            {user.role === 'ADMIN' ? 'BATCH MANAGER' : 'INTERN ENGINEER'}
          </Badge>
        )}

        <button
          onClick={toggleTheme}
          className="relative rounded-lg p-2 text-text-secondary hover:bg-bg-surface-elevated hover:text-text-primary transition-colors"
          title="Toggle Theme"
        >
          {actualTheme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>

        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifs(!showNotifs)}
            className="relative rounded-lg p-2 text-text-secondary hover:bg-bg-surface-elevated hover:text-text-primary transition-colors"
            title="Notifications"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-brand-primary px-1 text-[10px] font-bold text-bg-page ring-2 ring-bg-page animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifs && (
            <div className="absolute right-0 mt-3 w-80 sm:w-96 rounded-xl border border-border-default bg-bg-surface shadow-2xl z-50 overflow-hidden">
              <div className="flex items-center justify-between border-b border-border-subtle p-3.5 bg-bg-navbar/80">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-text-primary">
                    {user?.role === 'ADMIN' ? 'Mentor Notifications' : 'Intern Notifications'}
                  </span>
                  {unreadCount > 0 && (
                    <span className="rounded-full bg-brand-primary-soft text-brand-primary px-2 py-0.5 text-[10px] font-bold">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={() => markAllReadMutation.mutate()}
                    className="text-xs font-semibold text-brand-primary hover:text-brand-primary-hover flex items-center gap-1"
                  >
                    <CheckCheck className="h-3.5 w-3.5" /> Mark All Read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-border-subtle">
                {notifsLoading ? (
                  <div className="p-6 text-center text-xs text-text-muted">
                    Loading notifications...
                  </div>
                ) : notifsError ? (
                  <div className="p-6 text-center text-xs text-danger">
                    Failed to load notifications. Please try again.
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-text-muted">
                    No notifications yet.
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => {
                        if (!n.read) markReadMutation.mutate(n.id);
                      }}
                      className={`p-3.5 transition-colors flex items-start justify-between gap-3 cursor-pointer ${!n.read ? 'bg-brand-primary-soft hover:bg-brand-primary-soft/80' : 'hover:bg-bg-surface-elevated'
                        }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-text-primary truncate">{n.title}</span>
                          {!n.read && (
                            <span className="h-1.5 w-1.5 rounded-full bg-brand-primary shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-text-secondary mt-1 line-clamp-2">{n.message}</p>
                        <span className="text-[10px] text-text-muted mt-1.5 block font-mono">
                          {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {new Date(n.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      {!n.read && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            markReadMutation.mutate(n.id);
                          }}
                          title="Mark as read"
                          className="text-text-muted hover:text-text-primary p-1 rounded hover:bg-bg-surface-elevated"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="h-6 w-[1px] bg-border-default" />

        <div className="flex items-center space-x-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-border-default bg-bg-surface text-text-primary overflow-hidden shrink-0">
            {avatarUrl ? (
              <img src={avatarUrl} alt="avatar" className="h-full w-full object-cover" />
            ) : (
              <UserIcon className="h-5 w-5" />
            )}
          </div>
          <div className="hidden text-left sm:block">
            <p className="text-sm font-semibold leading-none text-text-primary">
              {user?.fullName || 'User'}
            </p>
            <p className="mt-1 text-xs text-text-secondary">{user?.email}</p>
          </div>
        </div>

        <button
          onClick={logout}
          title="Sign Out"
          className="flex items-center space-x-1.5 rounded-lg border border-border-default bg-bg-surface px-3 py-1.5 text-xs font-semibold text-text-secondary hover:border-danger/50 hover:bg-danger-soft hover:text-danger transition-all"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden md:inline">Sign Out</span>
        </button>
      </div>
    </header>
  );
};
