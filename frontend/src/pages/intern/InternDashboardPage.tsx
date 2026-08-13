import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  User as UserIcon,
  Code,
  Globe,
  CheckCircle2,
  CalendarCheck,
  CheckSquare,
  Flame,
  LayoutDashboard,
  ExternalLink
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const InternDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 0 && hour < 12) setGreeting('Good Morning');
    else if (hour >= 12 && hour < 17) setGreeting('Good Afternoon');
    else if (hour >= 17 && hour < 21) setGreeting('Good Evening');
    else setGreeting('Good Night');
  }, []);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['myProfile', user?.userId],
    queryFn: async () => {
      const res = await api.get('/intern/profile/me');
      return res.data.data;
    },
  });

  const { data: attendance } = useQuery({
    queryKey: ['myAttendanceSummary', user?.userId],
    queryFn: async () => {
      const res = await api.get('/intern/attendance/summary');
      return res.data.data;
    },
  });

  const { data: allTasks } = useQuery({
    queryKey: ['myTasks', user?.userId],
    queryFn: async () => {
      const res = await api.get('/intern/tasks');
      return res.data.data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-brand-primary flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-current border-t-transparent" />
          <span className="text-sm font-semibold">Loading Dashboard...</span>
        </div>
      </div>
    );
  }

  const tasksInProgress = allTasks ? allTasks.filter((t: any) => t.status === 'IN_PROGRESS').length : 0;
  const attendanceRate = attendance?.attendanceRate ? `${attendance.attendanceRate}%` : 'N/A';
  const presentDays = attendance?.presentDays || 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-text-primary tracking-tight">
            {greeting}, {user?.fullName} 👋
          </h1>
          <p className="text-sm text-text-muted mt-1">Here's your learning and performance overview.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Summary Card */}
        <Card className="glass-card md:col-span-1 border-border-default h-full flex flex-col">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <UserIcon className="h-5 w-5 text-brand-primary" /> Profile Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center text-center pb-6 flex-grow">
            <div className="mb-4">
              {profile?.profilePictureUrl ? (
                <img
                  src={profile.profilePictureUrl}
                  alt="Profile"
                  className="h-28 w-28 rounded-full object-cover border-4 border-bg-surface shadow-xl ring-2 ring-border-default mx-auto"
                />
              ) : (
                <div className="h-28 w-28 rounded-full bg-bg-surface border-4 border-bg-surface ring-2 ring-border-default shadow-xl flex items-center justify-center mx-auto">
                  <UserIcon className="h-12 w-12 text-text-muted opacity-50" />
                </div>
              )}
            </div>
            <h2 className="text-xl font-bold text-text-primary">{user?.fullName}</h2>
            <p className="text-sm font-medium text-brand-primary">Intern Engineer</p>
            <p className="text-xs text-text-muted mt-1 mb-6">{user?.email}</p>

            <div className="w-full text-left space-y-3 px-2 bg-bg-surface/50 rounded-xl p-4 border border-border-default mt-auto">
              <div>
                <p className="text-[10px] uppercase font-bold text-text-muted mb-1">Primary Skill</p>
                <p className="text-sm font-semibold text-text-primary">{profile?.primarySkill || 'Not set'}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-text-muted mb-1">Secondary Skill</p>
                <p className="text-sm font-semibold text-text-primary">{profile?.secondarySkill || 'Not set'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="md:col-span-2 space-y-6">
          {/* Quick Overview KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             <Card className="glass-card border-border-default hover:border-brand-primary/50 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CalendarCheck className="h-4 w-4 text-brand-primary" />
                    <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider">Attendance</h3>
                  </div>
                  <p className="text-2xl font-extrabold text-text-primary">{attendanceRate}</p>
                  <p className="text-xs text-text-muted mt-1">{presentDays} Days Present</p>
                </CardContent>
             </Card>
             <Card className="glass-card border-border-default hover:border-warning/50 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckSquare className="h-4 w-4 text-warning" />
                    <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider">Tasks</h3>
                  </div>
                  <p className="text-2xl font-extrabold text-text-primary">{tasksInProgress}</p>
                  <p className="text-xs text-text-muted mt-1">In Progress</p>
                </CardContent>
             </Card>
             <Card className="glass-card border-border-default hover:border-[#F4C95D]/50 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Flame className="h-4 w-4 fill-[#F4C95D] text-[#F4C95D]" />
                    <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider">Duolingo</h3>
                  </div>
                  <p className="text-2xl font-extrabold text-text-primary"><Badge variant="outline" className="border-[#F4C95D] text-[#F4C95D]">Active</Badge></p>
                  <p className="text-xs text-text-muted mt-1">Language Learning</p>
                </CardContent>
             </Card>
             <Card className="glass-card border-border-default hover:border-success/50 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <LayoutDashboard className="h-4 w-4 text-success" />
                    <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider">Projects</h3>
                  </div>
                  <p className="text-2xl font-extrabold text-text-primary"><Badge variant="outline" className="border-success text-success">Assigned</Badge></p>
                  <p className="text-xs text-text-muted mt-1">Enterprise AI</p>
                </CardContent>
             </Card>
          </div>

          {/* Technical Profile Section */}
          <Card className="glass-card border-border-default">
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Code className="h-5 w-5 text-brand-primary" /> Technical Profile
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">Current Tech Stack</h4>
                  <div className="flex flex-wrap gap-2">
                    {profile?.currentTechStack ? profile.currentTechStack.split(',').map((tech: string, i: number) => (
                      <Badge key={i} variant="outline" className="bg-bg-surface text-text-secondary border-border-default hover:bg-bg-surface/80">
                        {tech.trim()}
                      </Badge>
                    )) : (
                      <span className="text-sm text-text-muted italic">No tech stack configured</span>
                    )}
                  </div>
                </div>

                {(profile?.githubUrl || profile?.linkedinUrl) && (
                  <div className="pt-4 border-t border-border-default">
                    <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">Developer Links</h4>
                    <div className="flex flex-wrap gap-3">
                      {profile.githubUrl && (
                        <a href={profile.githubUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm font-medium text-text-primary hover:text-brand-primary transition-colors bg-bg-surface px-3 py-1.5 rounded-lg border border-border-default">
                          <Globe className="h-4 w-4" /> GitHub
                        </a>
                      )}
                      {profile.linkedinUrl && (
                        <a href={profile.linkedinUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm font-medium text-text-primary hover:text-brand-primary transition-colors bg-bg-surface px-3 py-1.5 rounded-lg border border-border-default">
                          <ExternalLink className="h-4 w-4" /> LinkedIn
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
