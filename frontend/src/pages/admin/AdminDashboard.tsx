import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api, { openSecureFile } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useAdminWorkspace, type InternProfile } from '@/context/AdminWorkspaceContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  UserCheck,
  Code,
  Globe,
  Calendar,
  Briefcase,
  GraduationCap,
  ExternalLink,
  BookOpen,
  Sparkles,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  CalendarDays,
  Send,
  Download,
  CheckCircle,
  Flame,
  Award,
  ShieldCheck,
  MessageSquare,
  GitPullRequest,
  GitCommit,
  CheckSquare,
  Search,
  Filter,
  XCircle,
  Ban,
  Trash2,
  Image as ImageIcon,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

type ModuleTab =
  | 'attendance'
  | 'leaves'
  | 'coding'
  | 'tasks'
  | 'duolingo'
  | 'projects'
  | 'timeline';

export const AdminDashboard: React.FC = () => {
  const { selectedIntern, setSelectedIntern } = useAdminWorkspace();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [activeModule, setActiveModule] = useState<ModuleTab>('attendance');
  const [feedbackSuccess, setFeedbackSuccess] = useState<string | null>(null);

  // Admin Account Management State
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminModalPhase, setAdminModalPhase] = useState<'DETAILS' | 'OTP' | 'PASSWORD'>('DETAILS');
  const [adminError, setAdminError] = useState<string | null>(null);
  const [newAdminForm, setNewAdminForm] = useState({ fullName: '', email: '', otp: '', password: '' });
  const [otpTimer, setOtpTimer] = useState(0);

  const { data: adminAccounts = [], isLoading: loadingAdmins } = useQuery({
    queryKey: ['adminAccounts'],
    queryFn: async () => {
      try {
        const res = await api.get('/admin/accounts');
        return Array.isArray(res?.data?.data) ? res.data.data : [];
      } catch {
        return [];
      }
    },
    enabled: !selectedIntern,
  });

  // Timer effect for OTP resend
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (otpTimer > 0) {
      timer = setInterval(() => setOtpTimer(prev => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [otpTimer]);

  const sendOtpMutation = useMutation({
    mutationFn: async (data: { email: string }) => {
      const res = await api.post('/auth/otp/send', { email: data.email, purpose: 'ADMIN_CREATION' });
      return res.data;
    },
    onSuccess: () => {
      setAdminError(null);
      setAdminModalPhase('OTP');
      setOtpTimer(60);
    },
    onError: (error: any) => {
      setAdminError(error.response?.data?.message || 'Failed to send verification code');
    }
  });

  const verifyOtpMutation = useMutation({
    mutationFn: async (data: { email: string, otp: string }) => {
      const res = await api.post('/auth/otp/verify', { email: data.email, otp: data.otp, purpose: 'ADMIN_CREATION' });
      return res.data;
    },
    onSuccess: () => {
      setAdminError(null);
      setAdminModalPhase('PASSWORD');
    },
    onError: (error: any) => {
      setAdminError(error.response?.data?.message || 'Invalid verification code');
    }
  });

  const createAdminMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post('/admin/accounts', {
        fullName: data.fullName,
        email: data.email,
        password: data.password
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminAccounts'] });
      setShowAdminModal(false);
      setNewAdminForm({ fullName: '', email: '', otp: '', password: '' });
      setAdminModalPhase('DETAILS');
      setAdminError(null);
      setFeedbackSuccess('Admin account created successfully!');
      setTimeout(() => setFeedbackSuccess(null), 3000);
    },
    onError: (error: any) => {
      setAdminError(error.response?.data?.message || 'Failed to create admin');
    }
  });

  const toggleAdminStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: string }) => 
      api.put(`/admin/accounts/${id}/${status === 'ACTIVE' ? 'disable' : 'enable'}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminAccounts'] });
      setFeedbackSuccess('Admin account status updated.');
      setTimeout(() => setFeedbackSuccess(null), 3000);
    },
    onError: (error: any) => {
      setFeedbackSuccess(null);
      alert(error.response?.data?.message || 'Failed to update admin status');
    }
  });

  const deleteAdminMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/admin/accounts/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminAccounts'] });
      setFeedbackSuccess('Admin account deleted.');
      setTimeout(() => setFeedbackSuccess(null), 3000);
    },
    onError: (error: any) => {
      setFeedbackSuccess(null);
      alert(error.response?.data?.message || 'Failed to delete admin');
    }
  });

  const [workHoursInput, setWorkHoursInput] = useState<string>('8.0');
  const [adminCommentInput, setAdminCommentInput] = useState<{ [key: string]: string }>({});

  // Assignment Filters State
  const [assignDateRange, setAssignDateRange] = useState<string>('All');
  const [assignTechStack, setAssignTechStack] = useState<string>('All');
  const [assignPlatform, setAssignPlatform] = useState<string>('All');
  const [assignDifficulty, setAssignDifficulty] = useState<string>('All');
  const [assignStatus, setAssignStatus] = useState<string>('All');
  const [assignSearch, setAssignSearch] = useState<string>('');

  // Fetch telemetry specifically for selected intern
  const { data: rawAttendance = [] } = useQuery({
    queryKey: ['adminInternAttendance', selectedIntern?.userId],
    queryFn: async () => {
      if (!selectedIntern?.userId) return [];
      try {
        const res = await api.get(`/admin/interns/${selectedIntern.userId}/attendance`);
        return Array.isArray(res?.data?.data) ? res.data.data : [];
      } catch {
        return [];
      }
    },
    enabled: !!selectedIntern?.userId,
    refetchInterval: 15000,
  });

  const { data: attendanceSummary } = useQuery({
    queryKey: ['adminInternAttendanceSummary', selectedIntern?.userId],
    queryFn: async () => {
      if (!selectedIntern?.userId) return null;
      try {
        const res = await api.get(`/admin/interns/${selectedIntern.userId}/attendance-summary`);
        return res?.data?.data || null;
      } catch {
        return null;
      }
    },
    enabled: !!selectedIntern?.userId,
    refetchInterval: 15000,
  });

  const { data: internLeaves = [] } = useQuery({
    queryKey: ['adminInternLeaves', selectedIntern?.userId],
    queryFn: async () => {
      if (!selectedIntern?.userId) return [];
      try {
        const res = await api.get(`/admin/leaves`, { params: { internId: selectedIntern.userId } });
        return Array.isArray(res?.data?.data) ? res.data.data : [];
      } catch {
        return [];
      }
    },
    enabled: !!selectedIntern?.userId,
    refetchInterval: 15000,
  });

  React.useEffect(() => {
    if (attendanceSummary?.requiredDailyHours) {
      setWorkHoursInput(attendanceSummary.requiredDailyHours.toString());
    } else if (selectedIntern?.requiredDailyHours) {
      setWorkHoursInput(selectedIntern.requiredDailyHours.toString());
    } else {
      setWorkHoursInput('8.0');
    }
  }, [attendanceSummary, selectedIntern]);

  const { data: rawAssignments = [], isLoading: assignLoading, isError: assignError, refetch: refetchAssignments } = useQuery({
    queryKey: ['adminInternAssignments', selectedIntern?.userId],
    queryFn: async () => {
      if (!selectedIntern?.userId) return [];
      try {
        const res = await api.get(`/admin/interns/${selectedIntern.userId}/assignments`);
        return Array.isArray(res?.data?.data) ? res.data.data : [];
      } catch (err) {
        // Re-throw so TanStack Query sets isError=true (genuine failure).
        // An empty assignment list is a 200 OK with data:[], not an error.
        throw err;
      }
    },
    enabled: !!selectedIntern?.userId,
    refetchInterval: 15000,
    retry: 1,
  });

  const { data: rawTasks = [] } = useQuery({
    queryKey: ['adminInternTasks', selectedIntern?.userId],
    queryFn: async () => {
      if (!selectedIntern?.userId) return [];
      try {
        const res = await api.get(`/admin/interns/${selectedIntern.userId}/tasks`);
        return Array.isArray(res?.data?.data) ? res.data.data : [];
      } catch {
        return [];
      }
    },
    enabled: !!selectedIntern?.userId,
    refetchInterval: 15000,
  });

  const { data: rawDuolingo = [] } = useQuery({
    queryKey: ['adminInternDuolingo', selectedIntern?.userId],
    queryFn: async () => {
      if (!selectedIntern?.userId) return [];
      try {
        const res = await api.get(`/admin/interns/${selectedIntern.userId}/duolingo`);
        return Array.isArray(res?.data?.data) ? res.data.data : [];
      } catch {
        return [];
      }
    },
    enabled: !!selectedIntern?.userId,
    refetchInterval: 15000,
  });

  const allAttendance = Array.isArray(rawAttendance) ? rawAttendance : [];
  const allAssignments = Array.isArray(rawAssignments) ? rawAssignments : [];
  const allTasks = Array.isArray(rawTasks) ? rawTasks : [];
  const allDuolingo = Array.isArray(rawDuolingo) ? rawDuolingo : [];

  const updateWorkScheduleMutation = useMutation({
    mutationFn: async (hours: number) => api.put(`/admin/interns/${selectedIntern?.userId}/work-schedule`, { requiredDailyHours: hours }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminInternAttendanceSummary'] });
      queryClient.invalidateQueries({ queryKey: ['adminWorkspaceInterns'] });
      setFeedbackSuccess('Work schedule policy updated successfully!');
      setTimeout(() => setFeedbackSuccess(null), 3000);
    },
  });

  const approveLeaveMutation = useMutation({
    mutationFn: async ({ id, comments }: { id: string; comments?: string }) => api.put(`/admin/leaves/${id}/review`, { status: 'APPROVED', adminComment: comments }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminInternLeaves'] });
      queryClient.invalidateQueries({ queryKey: ['adminInternAttendanceSummary'] });
      queryClient.invalidateQueries({ queryKey: ['adminLeaves'] });
      queryClient.invalidateQueries({ queryKey: ['myAttendanceSummary'] });
      queryClient.invalidateQueries({ queryKey: ['myLeaves'] });
      setFeedbackSuccess('Leave request approved!');
      setTimeout(() => setFeedbackSuccess(null), 3000);
    },
  });

  const rejectLeaveMutation = useMutation({
    mutationFn: async ({ id, comments }: { id: string; comments?: string }) => api.put(`/admin/leaves/${id}/review`, { status: 'REJECTED', adminComment: comments }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminInternLeaves'] });
      queryClient.invalidateQueries({ queryKey: ['adminInternAttendanceSummary'] });
      queryClient.invalidateQueries({ queryKey: ['adminLeaves'] });
      queryClient.invalidateQueries({ queryKey: ['myAttendanceSummary'] });
      queryClient.invalidateQueries({ queryKey: ['myLeaves'] });
      setFeedbackSuccess('Leave request rejected.');
      setTimeout(() => setFeedbackSuccess(null), 3000);
    },
  });

  const invalidateAllAdminQueries = () => {
    queryClient.invalidateQueries({ queryKey: ['adminWorkspaceInterns'] });
    queryClient.invalidateQueries({ queryKey: ['adminInterns'] });
    queryClient.invalidateQueries({ queryKey: ['adminDashboard'] });
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
    queryClient.invalidateQueries({ queryKey: ['adminInternAttendance'] });
    queryClient.invalidateQueries({ queryKey: ['adminInternAttendanceSummary'] });
    queryClient.invalidateQueries({ queryKey: ['adminInternLeaves'] });
    queryClient.invalidateQueries({ queryKey: ['adminInternAssignments'] });
    queryClient.invalidateQueries({ queryKey: ['adminInternTasks'] });
    queryClient.invalidateQueries({ queryKey: ['adminInternDuolingo'] });
    queryClient.invalidateQueries({ queryKey: ['adminLeaves'] });
    queryClient.invalidateQueries({ queryKey: ['adminAssignmentsAll'] });
  };

  const approveInternMutation = useMutation({
    mutationFn: async (id: string) => api.patch(`/admin/interns/${id}/approve`),
    onSuccess: () => {
      invalidateAllAdminQueries();
      setFeedbackSuccess('Intern account approved and activated!');
      setTimeout(() => setFeedbackSuccess(null), 3000);
    },
  });

  const rejectInternMutation = useMutation({
    mutationFn: async (id: string) => api.patch(`/admin/interns/${id}/reject`),
    onSuccess: (_, id) => {
      invalidateAllAdminQueries();
      if (selectedIntern?.userId === id) {
        setSelectedIntern(null);
      }
      setFeedbackSuccess('Intern registration rejected.');
      setTimeout(() => setFeedbackSuccess(null), 3000);
    },
  });

  const disableInternMutation = useMutation({
    mutationFn: async (id: string) => api.patch(`/admin/interns/${id}/disable`),
    onSuccess: (res, id) => {
      invalidateAllAdminQueries();
      if (selectedIntern?.userId === id && res?.data?.data) {
        setSelectedIntern(res.data.data);
      }
      setFeedbackSuccess('Intern account disabled.');
      setTimeout(() => setFeedbackSuccess(null), 3000);
    },
  });

  const enableInternMutation = useMutation({
    mutationFn: async (id: string) => api.patch(`/admin/interns/${id}/enable`),
    onSuccess: (res, id) => {
      invalidateAllAdminQueries();
      if (selectedIntern?.userId === id && res?.data?.data) {
        setSelectedIntern(res.data.data);
      }
      setFeedbackSuccess('Intern account enabled.');
      setTimeout(() => setFeedbackSuccess(null), 3000);
    },
  });

  const deleteInternMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/admin/interns/${id}`),
    onSuccess: (_, id) => {
      invalidateAllAdminQueries();
      if (selectedIntern?.userId === id) {
        setSelectedIntern(null);
      }
      setFeedbackSuccess('Intern account deleted and files cleaned up.');
      setTimeout(() => setFeedbackSuccess(null), 3000);
    },
  });

  const approveAssignmentMutation = useMutation({
    mutationFn: async (id: string) => api.patch(`/admin/assignments/${id}/approve`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminAssignmentsAll'] });
      queryClient.invalidateQueries({ queryKey: ['adminInternAssignments', selectedIntern?.userId] });
      setFeedbackSuccess('Assignment submission approved!');
      setTimeout(() => setFeedbackSuccess(null), 3000);
    },
  });

  const rejectAssignmentMutation = useMutation({
    mutationFn: async (id: string) => api.patch(`/admin/assignments/${id}/reject`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminAssignmentsAll'] });
      queryClient.invalidateQueries({ queryKey: ['adminInternAssignments', selectedIntern?.userId] });
      setFeedbackSuccess('Assignment submission rejected.');
      setTimeout(() => setFeedbackSuccess(null), 3000);
    },
  });

  if (!selectedIntern) {
    return (
      <div className="space-y-6 animate-fade-in pb-12">
        {feedbackSuccess && (
          <div className="flex items-center space-x-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3.5 text-sm font-semibold text-emerald-300">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
            <span>{feedbackSuccess}</span>
          </div>
        )}
        
        <Card className="glass-card border-border-default p-12 text-center text-text-muted mb-8">
          <Sparkles className="mx-auto mb-4 h-12 w-12 text-brand-primary animate-pulse opacity-80" />
          <h2 className="text-xl font-bold text-text-primary">Welcome to the Admin Dashboard</h2>
          <p className="mt-1 text-xs text-text-muted max-w-md mx-auto">
            Select an intern from the directory on the left to view their detailed metrics, or manage global admin accounts below.
          </p>
        </Card>

        {/* Admin Account Management */}
        <Card className="glass-card border-border-default overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-border-subtle bg-bg-surface/50">
            <div>
              <CardTitle className="text-lg font-bold text-text-primary flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-brand-primary" /> Admin Account Management
              </CardTitle>
              <CardDescription className="text-xs text-text-muted mt-1">
                Manage system administrators and their access.
              </CardDescription>
            </div>
            <Button 
              onClick={() => setShowAdminModal(true)}
              className="bg-brand-primary hover:bg-brand-primary/90 text-bg-page font-bold text-xs"
            >
              + Create Admin
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {loadingAdmins ? (
              <div className="p-8 text-center text-xs text-text-muted">Loading administrators...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-bg-surface border-b border-border-subtle text-xs uppercase text-text-muted">
                    <tr>
                      <th className="p-4 font-semibold">Name</th>
                      <th className="p-4 font-semibold">Email</th>
                      <th className="p-4 font-semibold">Status</th>
                      <th className="p-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle">
                    {adminAccounts.map((admin: any) => {
                      const isSelf = admin.id === user?.userId;
                      return (
                      <tr key={admin.id} className="hover:bg-bg-surface/50 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-bg-surface flex items-center justify-center font-bold text-brand-primary text-xs border border-border-default">
                              {admin.fullName ? admin.fullName.charAt(0).toUpperCase() : 'A'}
                            </div>
                            <span className="font-semibold text-text-primary text-sm">
                              {admin.fullName || 'Batch Manager'} 
                              {isSelf && <span className="ml-2 text-[10px] text-text-muted font-normal">(You)</span>}
                            </span>
                          </div>
                        </td>
                        <td className="p-4 text-xs font-mono text-text-secondary">{admin.email}</td>
                        <td className="p-4">
                          <Badge variant={admin.status === 'ACTIVE' ? 'success' : 'warning'} className="text-[10px]">
                            {admin.status}
                          </Badge>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-2" title={isSelf ? "Your own administrator account cannot be disabled or deleted." : ""}>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => toggleAdminStatusMutation.mutate({ id: admin.id, status: admin.status })}
                              disabled={toggleAdminStatusMutation.isPending || isSelf}
                              className={`h-8 text-xs font-bold border ${admin.status === 'ACTIVE' ? 'border-warning/40 text-warning hover:bg-warning/10' : 'border-success/40 text-success hover:bg-success/10'}`}
                            >
                              {admin.status === 'ACTIVE' ? 'Disable' : 'Enable'}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                if (window.confirm('Are you sure you want to delete this admin account?')) {
                                  deleteAdminMutation.mutate(admin.id);
                                }
                              }}
                              disabled={deleteAdminMutation.isPending || isSelf}
                              className="h-8 text-xs font-bold border border-danger/40 text-danger hover:bg-danger/10"
                            >
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create Admin Modal */}
        {showAdminModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
            <Card className="glass-card w-full max-w-md border-border-default shadow-2xl">
              <CardHeader className="border-b border-border-subtle pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-brand-primary" /> Create New Admin
                  </CardTitle>
                  <button onClick={() => { setShowAdminModal(false); setAdminError(null); setAdminModalPhase('DETAILS'); setNewAdminForm({ fullName: '', email: '', otp: '', password: '' }); }} className="text-text-muted hover:text-text-primary transition-colors">
                    <XCircle className="h-5 w-5" />
                  </button>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                {adminError && (
                  <div className="p-3 bg-danger/10 border border-danger/30 rounded-lg text-danger text-xs font-semibold">
                    {adminError}
                  </div>
                )}

                {adminModalPhase === 'DETAILS' && (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-text-secondary uppercase">Full Name</label>
                      <Input 
                        placeholder="Enter full name" 
                        value={newAdminForm.fullName}
                        onChange={e => setNewAdminForm({...newAdminForm, fullName: e.target.value})}
                        className="bg-bg-input border-border-default focus:border-brand-primary"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-text-secondary uppercase">Email Address</label>
                      <Input 
                        type="email"
                        placeholder="admin@company.com" 
                        value={newAdminForm.email}
                        onChange={e => setNewAdminForm({...newAdminForm, email: e.target.value})}
                        className="bg-bg-input border-border-default focus:border-brand-primary font-mono"
                      />
                    </div>
                    <div className="pt-2 flex justify-end gap-3">
                      <Button variant="outline" onClick={() => { setShowAdminModal(false); setAdminError(null); setAdminModalPhase('DETAILS'); setNewAdminForm({ fullName: '', email: '', otp: '', password: '' }); }}>
                        Cancel
                      </Button>
                      <Button 
                        onClick={() => sendOtpMutation.mutate({ email: newAdminForm.email })}
                        disabled={sendOtpMutation.isPending || !newAdminForm.email || !newAdminForm.fullName}
                        className="bg-brand-primary text-bg-page font-bold"
                      >
                        {sendOtpMutation.isPending ? 'Sending OTP...' : 'Send Verification Code'}
                      </Button>
                    </div>
                  </>
                )}

                {adminModalPhase === 'OTP' && (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-text-secondary uppercase">Verification Code (OTP)</label>
                      <p className="text-xs text-text-muted mb-2">Code sent to: {newAdminForm.email}</p>
                      <Input 
                        placeholder="Enter 6-digit code" 
                        value={newAdminForm.otp}
                        maxLength={6}
                        onChange={e => setNewAdminForm({...newAdminForm, otp: e.target.value.replace(/\D/g, '')})}
                        className="bg-bg-input border-border-default focus:border-brand-primary font-mono text-center tracking-widest text-lg"
                      />
                    </div>
                    <div className="pt-2 flex justify-between items-center">
                      <Button 
                        variant="ghost" 
                        onClick={() => sendOtpMutation.mutate({ email: newAdminForm.email })}
                        disabled={otpTimer > 0 || sendOtpMutation.isPending}
                        className="text-xs"
                      >
                        {otpTimer > 0 ? `Resend code in ${otpTimer}s` : 'Resend Code'}
                      </Button>
                      <div className="flex gap-3">
                        <Button variant="outline" onClick={() => setAdminModalPhase('DETAILS')}>
                          Back
                        </Button>
                        <Button 
                          onClick={() => verifyOtpMutation.mutate({ email: newAdminForm.email, otp: newAdminForm.otp })}
                          disabled={verifyOtpMutation.isPending || newAdminForm.otp.length !== 6}
                          className="bg-brand-primary text-bg-page font-bold"
                        >
                          {verifyOtpMutation.isPending ? 'Verifying...' : 'Verify OTP'}
                        </Button>
                      </div>
                    </div>
                  </>
                )}

                {adminModalPhase === 'PASSWORD' && (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-text-secondary uppercase">Setup Password</label>
                      <Input 
                        type="password"
                        autoComplete="new-password"
                        placeholder="Create a strong password" 
                        value={newAdminForm.password}
                        onChange={e => setNewAdminForm({...newAdminForm, password: e.target.value})}
                        className="bg-bg-input border-border-default focus:border-brand-primary"
                      />
                    </div>
                    <div className="pt-2 flex justify-end gap-3">
                      <Button variant="outline" onClick={() => { setShowAdminModal(false); setAdminError(null); setAdminModalPhase('DETAILS'); setNewAdminForm({ fullName: '', email: '', otp: '', password: '' }); }}>
                        Cancel
                      </Button>
                      <Button 
                        onClick={() => createAdminMutation.mutate(newAdminForm)}
                        disabled={createAdminMutation.isPending || !newAdminForm.password}
                        className="bg-brand-primary text-bg-page font-bold"
                      >
                        {createAdminMutation.isPending ? 'Creating...' : 'Create Admin'}
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    );
  }

  // Telemetry specifically for selectedIntern
  const internAttendance = allAttendance;
  const internAssignments = allAssignments;
  const internTasks = allTasks;
  const internDuolingo = allDuolingo.length > 0 ? allDuolingo[0] : null;

  const hasActivity = internAttendance.length > 0 || internAssignments.length > 0 || internTasks.length > 0 || !!internDuolingo;

  // Dynamic Metrics
  const totalCheckins = internAttendance.length;
  const presentCheckins = internAttendance.filter((a: any) => a && a.status === 'PRESENT').length;
  const attendancePercent = totalCheckins > 0 ? Math.round((presentCheckins / totalCheckins) * 100) : 0;

  const solvedCount = internAssignments.filter((a: any) => a && (a.status === 'SOLVED' || a.status === 'APPROVED')).length;
  const overallScore = hasActivity ? Math.min(100, Math.round((attendancePercent + Math.min(100, solvedCount * 10)) / 2)) : 0;

  const handleActionClick = (msg: string) => {
    setFeedbackSuccess(msg);
    setTimeout(() => setFeedbackSuccess(null), 3500);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {feedbackSuccess && (
        <div className="flex items-center space-x-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3.5 text-sm font-semibold text-emerald-300">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
          <span>{feedbackSuccess}</span>
        </div>
      )}

      {/* ========================================== */}
      {/* 1. WORKSPACE HEADER BANNER                 */}
      {/* ========================================== */}
      <Card className="glass-card border-border-default bg-bg-surface shadow-xl">
        <CardContent className="p-6">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
            {/* Left: Avatar & Identity */}
            <div className="flex items-start sm:items-center space-x-4">
              <div className="h-20 w-20 shrink-0 rounded-2xl bg-bg-surface flex items-center justify-center text-3xl font-black text-text-primary shadow-xl border border-border-default overflow-hidden">
                {selectedIntern.profilePictureUrl ? (
                  <img src={selectedIntern.profilePictureUrl} alt="avatar" className="h-full w-full object-cover" />
                ) : (
                  selectedIntern.fullName ? selectedIntern.fullName.charAt(0).toUpperCase() : 'I'
                )}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">
                    {selectedIntern.fullName}
                  </h1>

                  <Badge
                    variant={selectedIntern.status === 'ACTIVE' ? 'success' : 'warning'}
                    className="text-xs font-bold"
                  >
                    {selectedIntern.status}
                  </Badge>
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-y-1 gap-x-4 text-xs sm:text-sm text-text-secondary">
                  <span className="flex items-center gap-1.5 font-medium">
                    <GraduationCap className="h-4 w-4 text-success shrink-0" />
                    {selectedIntern.college || 'Engineering Institute'}
                  </span>
                  <span className="text-[#303630]">|</span>
                  <span className="flex items-center gap-1.5 font-medium">
                    <Code className="h-4 w-4 text-brand-primary shrink-0" />
                    Primary Tech: <strong className="text-brand-primary">{selectedIntern.primarySkill || 'Full Stack'}</strong>
                  </span>
                  <span className="text-[#303630]">|</span>
                  <span className="text-brand-primary font-semibold">
                    Learning Track
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Key Score KPI Pills */}
            <div className="flex items-center gap-4 border-t xl:border-t-0 border-border-default pt-4 xl:pt-0">

              <div className="rounded-xl bg-bg-surface border border-border-default px-4 py-2.5 text-center min-w-[120px]">
                <span className="block text-[10px] uppercase font-extrabold tracking-wider text-text-muted">
                  Attendance %
                </span>
                <span className="text-2xl font-black text-success">{attendancePercent}%</span>
              </div>
              <div className="rounded-xl bg-bg-surface border border-border-default px-4 py-2.5 text-center min-w-[120px]">
                <span className="block text-[10px] uppercase font-extrabold tracking-wider text-text-muted">
                  Mentor Lead
                </span>
                <span className="text-sm font-bold text-text-primary block mt-1">Batch Manager</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ========================================== */}
      {/* 2. MODULE NAVIGATION BAR (Linear/Notion)   */}
      {/* ========================================== */}
      <div className="flex items-center space-x-1.5 overflow-x-auto rounded-2xl bg-bg-input p-1.5 border border-border-default">
        {[
          { id: 'attendance', label: 'Attendance', icon: UserCheck },
          { id: 'leaves', label: 'Leave Requests & Policy', icon: CalendarDays },
          { id: 'coding', label: 'Coding & Submissions', icon: Code },
          { id: 'tasks', label: 'Tasks', icon: CheckSquare },
          { id: 'duolingo', label: 'Duolingo', icon: Flame },
          { id: 'projects', label: 'Projects', icon: GitPullRequest },
          { id: 'timeline', label: 'Timeline', icon: Clock },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeModule === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveModule(tab.id as ModuleTab)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-brand-primary text-bg-page shadow-lg shadow-[#CFFF3D]/20'
                  : 'text-text-secondary hover:bg-bg-surface hover:text-text-primary'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================== */}
      {/* 3. MAIN WORKSPACE WITH RIGHT QUICK ACTIONS */}
      {/* ========================================== */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-start">
        {/* CENTER MODULE AREA (Span 3) */}
        <div className="xl:col-span-3 space-y-6">
          {/* MODULE 1: ATTENDANCE */}
          {activeModule === 'attendance' && (() => {
            const workingDays = attendanceSummary?.totalWorkingDays ?? internAttendance.length;
            const presentDays = attendanceSummary?.presentDays ?? internAttendance.filter((a: any) => a.status === 'PRESENT').length;
            const halfDays = attendanceSummary?.halfDays ?? internAttendance.filter((a: any) => a.status === 'HALF_DAY').length;
            const absentDays = attendanceSummary?.absentDays ?? (workingDays - presentDays);
            const approvedLeaves = attendanceSummary?.approvedLeaveDays ?? 0;
            const calcRate = attendanceSummary?.attendanceRate ?? (workingDays > 0 ? Math.round((presentDays / workingDays) * 100) : 0);

            return (
              <div className="space-y-6 animate-fade-in">
                <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
                  <Card className="glass-card">
                    <CardContent className="p-3.5 text-center">
                      <span className="text-[11px] text-text-muted uppercase font-bold block">Present</span>
                      <p className="text-xl font-black text-success mt-1">{presentDays}</p>
                    </CardContent>
                  </Card>
                  <Card className="glass-card">
                    <CardContent className="p-3.5 text-center">
                      <span className="text-[11px] text-text-muted uppercase font-bold block">Half-Day (0.5)</span>
                      <p className="text-xl font-black text-warning mt-1">{halfDays}</p>
                    </CardContent>
                  </Card>
                  <Card className="glass-card">
                    <CardContent className="p-3.5 text-center">
                      <span className="text-[11px] text-text-muted uppercase font-bold block">Absent</span>
                      <p className="text-xl font-black text-danger mt-1">{absentDays}</p>
                    </CardContent>
                  </Card>
                  <Card className="glass-card">
                    <CardContent className="p-3.5 text-center">
                      <span className="text-[11px] text-text-muted uppercase font-bold block">Approved Leave</span>
                      <p className="text-xl font-black text-brand-primary mt-1">{approvedLeaves}</p>
                    </CardContent>
                  </Card>
                  <Card className="glass-card">
                    <CardContent className="p-3.5 text-center">
                      <span className="text-[11px] text-text-muted uppercase font-bold block">Working Days</span>
                      <p className="text-xl font-black text-brand-primary mt-1">{workingDays}</p>
                    </CardContent>
                  </Card>
                  <Card className="glass-card">
                    <CardContent className="p-3.5 text-center">
                      <span className="text-[11px] text-text-muted uppercase font-bold block">Attendance Rate</span>
                      <p className="text-xl font-black text-success mt-1">{calcRate}%</p>
                    </CardContent>
                  </Card>
                </div>

                <Card className="glass-card">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-bold">30-Day Attendance Trend Graph</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {workingDays === 0 ? (
                      <div className="h-48 flex items-center justify-center text-xs text-text-muted italic">
                        No activity available yet.
                      </div>
                    ) : (
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={internAttendance.map((a: any) => ({ day: a.attendanceDate, hours: a.workingHours || 8.0 }))}>
                            <XAxis dataKey="day" stroke="var(--text-muted)" fontSize={12} />
                            <YAxis stroke="var(--text-muted)" fontSize={12} />
                            <Tooltip contentStyle={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }} />
                            <Area type="monotone" dataKey="hours" stroke="var(--brand-primary)" fill="var(--brand-primary)" fillOpacity={0.2} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    )}

                    {/* Small attendance summary under the graph */}
                    <div className="flex flex-wrap items-center justify-around gap-4 rounded-xl bg-bg-surface p-3.5 border border-border-default text-xs font-bold text-text-secondary">
                      <div>Present : <span className="text-success">{presentDays}</span></div>
                      <div className="h-3 w-[1px] bg-[#303630] hidden sm:block" />
                      <div>Half-Day : <span className="text-warning">{halfDays}</span></div>
                      <div className="h-3 w-[1px] bg-[#303630] hidden sm:block" />
                      <div>Absent : <span className="text-danger">{absentDays}</span></div>
                      <div className="h-3 w-[1px] bg-[#303630] hidden sm:block" />
                      <div>Approved Leave : <span className="text-brand-primary">{approvedLeaves}</span></div>
                      <div className="h-3 w-[1px] bg-[#303630] hidden sm:block" />
                      <div>Working Days : <span className="text-brand-primary">{workingDays}</span></div>
                      <div className="h-3 w-[1px] bg-[#303630] hidden sm:block" />
                      <div>Rate : <span className="text-success">{calcRate}%</span></div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass-card">
                  <CardHeader><CardTitle className="text-base font-bold">Detailed Check-In Logs</CardTitle></CardHeader>
                  <CardContent className="space-y-2">
                    {internAttendance.length === 0 ? (
                      <p className="text-xs text-text-muted py-6 text-center italic">No activity available yet.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="border-b border-border-subtle text-text-muted uppercase font-bold text-[10px]">
                              <th className="p-2.5">Date</th>
                              <th className="p-2.5">Check-In</th>
                              <th className="p-2.5">Check-Out</th>
                              <th className="p-2.5">Working Hours</th>
                              <th className="p-2.5">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border-subtle">
                            {internAttendance.map((att: any) => (
                              <tr key={att.id}>
                                <td className="p-2.5 font-mono font-bold text-text-primary">{att.attendanceDate}</td>
                                <td className="p-2.5 font-mono text-text-secondary">{att.checkInTime || '09:00'}</td>
                                <td className="p-2.5 font-mono text-text-secondary">{att.checkOutTime || 'In Progress'}</td>
                                <td className="p-2.5 font-mono text-brand-primary">{att.workingHours ? `${att.workingHours} hrs` : 'In Progress'}</td>
                                <td className="p-2.5">
                                  {!att.checkOutTime && !att.logoutTime ? (
                                    <Badge className="bg-[#62B7FF]/20 text-brand-primary border border-brand-primary/30">IN PROGRESS</Badge>
                                  ) : (
                                    <Badge variant={att.status === 'PRESENT' ? 'success' : att.status === 'HALF_DAY' ? 'warning' : 'destructive'}>{att.status}</Badge>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            );
          })()}

          {/* MODULE 1.5: LEAVES & WORK SCHEDULE POLICY */}
          {activeModule === 'leaves' && (
            <div className="space-y-6 animate-fade-in">
              <Card className="glass-card border-border-default">
                <CardHeader>
                  <CardTitle className="text-base font-bold text-text-primary flex items-center gap-2">
                    <Clock className="h-5 w-5 text-brand-primary" /> Per-Intern Working Hours Policy
                  </CardTitle>
                  <CardDescription className="text-xs text-text-muted mt-1.5">
                    <ul className="list-disc list-inside space-y-1">
                      <li><strong className="text-text-primary">Present:</strong> Work duration &ge; 100% of policy</li>
                      <li><strong className="text-text-primary">Half-Day:</strong> Work duration &ge; 50% of policy</li>
                      <li><strong className="text-text-primary">Absent:</strong> Work duration &lt; 50% of policy</li>
                    </ul>
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <p className="text-sm font-semibold text-text-primary">
                      Current Policy: <span className="text-brand-primary font-mono font-bold">{workHoursInput} Hours / Day</span>
                    </p>
                    <ul className="text-xs text-text-muted list-disc list-inside space-y-0.5">
                      <li>Automatically evaluated on mentee checkout</li>
                      <li>Customizable per individual mentee</li>
                    </ul>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Input
                      type="number"
                      step="0.5"
                      min="1"
                      max="24"
                      value={workHoursInput}
                      onChange={(e) => setWorkHoursInput(e.target.value)}
                      className="w-28 bg-bg-surface border-border-default text-text-primary font-mono text-sm"
                    />
                    <Button
                      onClick={() => updateWorkScheduleMutation.mutate(parseFloat(workHoursInput) || 8.0)}
                      disabled={updateWorkScheduleMutation.isPending}
                      className="bg-brand-primary hover:bg-brand-primary/90 text-bg-page font-bold px-6"
                    >
                      {updateWorkScheduleMutation.isPending ? 'Saving...' : 'Save Policy'}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card overflow-hidden">
                <CardHeader>
                  <CardTitle className="text-base font-bold text-text-primary flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <CalendarDays className="h-5 w-5 text-brand-primary" /> Leave Applications Review
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {internLeaves.length} Total Requests
                    </Badge>
                  </CardTitle>
                  <CardDescription className="text-xs text-text-muted mt-1.5">
                    <ul className="list-disc list-inside space-y-0.5">
                      <li>Review leave applications for <strong className="text-text-primary">{selectedIntern.fullName}</strong></li>
                      <li>Approved leaves are automatically excluded from absent day penalties</li>
                    </ul>
                  </CardDescription>
                </CardHeader>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-border-subtle bg-bg-surface text-xs uppercase text-text-muted">
                      <tr>
                        <th className="p-3.5">Submitted</th>
                        <th className="p-3.5">Leave Dates</th>
                        <th className="p-3.5">Type & Days</th>
                        <th className="p-3.5">Reason</th>
                        <th className="p-3.5">Status</th>
                        <th className="p-3.5">Admin Action / Comment</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-subtle">
                      {internLeaves.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-text-muted text-xs">
                            No leave requests submitted by this mentee yet.
                          </td>
                        </tr>
                      ) : (
                        internLeaves.map((l: any) => (
                          <tr key={l.id} className="hover:bg-bg-surface transition-colors">
                            <td className="p-3.5 text-xs text-text-muted">
                              {l.createdAt ? new Date(l.createdAt).toLocaleDateString() : 'N/A'}
                            </td>
                            <td className="p-3.5 font-mono text-xs text-text-primary font-medium">
                              {l.startDate} &rarr; {l.endDate}
                            </td>
                            <td className="p-3.5">
                              <span className="font-semibold text-text-primary block text-xs">{l.leaveType}</span>
                              <span className="text-[10px] text-text-muted">{l.workingDaysCount || l.totalDays} Working Days</span>
                            </td>
                            <td className="p-3.5 text-xs text-text-secondary max-w-xs truncate">
                              {l.reason}
                            </td>
                            <td className="p-3.5">
                              {l.status === 'APPROVED' && <Badge className="bg-success/20 text-success border border-success/30">APPROVED</Badge>}
                              {l.status === 'REJECTED' && <Badge className="bg-danger/20 text-danger border border-danger/30">REJECTED</Badge>}
                              {l.status === 'PENDING' && <Badge className="bg-warning/20 text-warning border border-warning/30 animate-pulse">PENDING</Badge>}
                              {l.status === 'CANCELLED' && <Badge className="bg-[#7F8780]/20 text-text-secondary border border-[#7F8780]/30">CANCELLED</Badge>}
                            </td>
                            <td className="p-3.5">
                              {l.status === 'PENDING' ? (
                                <div className="flex items-center gap-2">
                                  <Input
                                    type="text"
                                    placeholder="Optional comment..."
                                    value={adminCommentInput[l.id] || ''}
                                    onChange={(e) => setAdminCommentInput({ ...adminCommentInput, [l.id]: e.target.value })}
                                    className="h-8 text-xs w-36 bg-bg-surface border-border-default text-text-primary"
                                  />
                                  <Button
                                    size="sm"
                                    onClick={() => approveLeaveMutation.mutate({ id: l.id, comments: adminCommentInput[l.id] })}
                                    disabled={approveLeaveMutation.isPending}
                                    className="h-8 bg-success hover:bg-success/90 text-bg-page text-xs px-2.5 font-bold"
                                  >
                                    Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => rejectLeaveMutation.mutate({ id: l.id, comments: adminCommentInput[l.id] })}
                                    disabled={rejectLeaveMutation.isPending}
                                    className="h-8 bg-danger hover:bg-danger/90 text-bg-page text-xs px-2.5 font-bold"
                                  >
                                    Reject
                                  </Button>
                                </div>
                              ) : (
                                <span className="text-xs text-text-muted">
                                  {l.adminComment ? `Note: "${l.adminComment}"` : (l.status === 'CANCELLED' ? 'Cancelled by Mentee' : 'Reviewed')}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {/* MODULE 2: CODING & SUBMISSIONS */}
          {activeModule === 'coding' && (() => {
            if (assignLoading) {
              return (
                <Card className="glass-card p-12 text-center text-text-muted">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary mx-auto mb-3" />
                  <p className="text-xs text-text-muted">Loading coding submissions...</p>
                </Card>
              );
            }

            if (assignError) {
              return (
                <Card className="glass-card p-12 text-center border-danger/30">
                  <AlertCircle className="mx-auto mb-3 h-10 w-10 text-danger opacity-80" />
                  <h3 className="text-base font-bold text-text-primary">Failed to load coding submissions</h3>
                  <p className="text-xs text-danger mt-1 mb-4">A network or server error occurred while retrieving data.</p>
                  <Button onClick={() => refetchAssignments()} variant="outline" size="sm" className="border-danger/50 text-danger hover:bg-danger/10">
                    Retry Fetch
                  </Button>
                </Card>
              );
            }

            const solved = internAssignments;
            const totalProblems = solved.length;
            const easyCount = solved.filter((a: any) => (a.difficulty || '').toUpperCase() === 'EASY').length;
            const mediumCount = solved.filter((a: any) => (a.difficulty || '').toUpperCase() === 'MEDIUM').length;
            const hardCount = solved.filter((a: any) => (a.difficulty || '').toUpperCase() === 'HARD').length;
            const totalTimeSpent = solved.reduce((acc: number, a: any) => acc + (Number(a.timeTakenMinutes) || 0), 0);
            const avgTime = totalProblems > 0 ? Math.round(totalTimeSpent / totalProblems) : 0;
            const platformsUsed = Array.from(new Set(solved.map((a: any) => a.platform || 'UNKNOWN'))).filter(Boolean).length;

            let currentStreak = 0;
            if (totalProblems > 0) {
              const dates = Array.from(new Set(solved.map((a: any) => a.submissionDate).filter(Boolean))).sort().reverse();
              if (dates.length > 0) {
                const todayStr = new Date().toISOString().split('T')[0];
                const yestDate = new Date();
                yestDate.setDate(yestDate.getDate() - 1);
                const yestStr = yestDate.toISOString().split('T')[0];
                
                if (dates[0] === todayStr || dates[0] === yestStr) {
                  currentStreak = 1;
                  let curr = new Date(dates[0] as string);
                  for (let i = 1; i < dates.length; i++) {
                    const prev = new Date(curr);
                    prev.setDate(prev.getDate() - 1);
                    const prevStr = prev.toISOString().split('T')[0];
                    if (dates[i] === prevStr) {
                      currentStreak++;
                      curr = prev;
                    } else {
                      break;
                    }
                  }
                }
              }
            }

            const now = new Date();
            const weeklyData = [1, 2, 3, 4].map((w) => {
              const count = solved.filter((a: any) => {
                if (!a.submissionDate) return false;
                const subDate = new Date(a.submissionDate);
                const diffDays = Math.floor((now.getTime() - subDate.getTime()) / (1000 * 3600 * 24));
                const weekNum = Math.floor(diffDays / 7) + 1;
                return weekNum === w || (w === 4 && weekNum >= 4);
              }).length;
              return { week: `Wk ${w}`, solved: count };
            }).reverse();

            const filtered = solved.filter((a: any) => {
              if (assignTechStack !== 'All' && (a.techStack || '').toUpperCase() !== assignTechStack.toUpperCase()) return false;
              if (assignPlatform !== 'All' && (a.platform || '').toUpperCase() !== assignPlatform.toUpperCase()) return false;
              if (assignDifficulty !== 'All' && (a.difficulty || 'MEDIUM').toUpperCase() !== assignDifficulty.toUpperCase()) return false;
              if (assignStatus !== 'All') {
                const normStatus = (a.status === 'SOLVED' || a.status === 'APPROVED') ? 'Approved' : (a.status === 'PENDING' || a.status === 'PENDING_REVIEW') ? 'Pending Review' : 'Rejected';
                if (normStatus !== assignStatus) return false;
              }
              if (assignSearch) {
                const q = assignSearch.toLowerCase();
                const matchTitle = (a.title || '').toLowerCase().includes(q);
                const matchRepo = (a.problemUrl || '').toLowerCase().includes(q);
                if (!matchTitle && !matchRepo) return false;
              }
              if (assignDateRange !== 'All' && a.submissionDate) {
                const subDate = new Date(a.submissionDate);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                if (assignDateRange === 'Today') {
                  if (subDate.toDateString() !== today.toDateString()) return false;
                } else if (assignDateRange === 'Yesterday') {
                  const yest = new Date(today);
                  yest.setDate(yest.getDate() - 1);
                  if (subDate.toDateString() !== yest.toDateString()) return false;
                } else if (assignDateRange === 'Last 7 Days') {
                  const diff = (today.getTime() - subDate.getTime()) / (1000 * 3600 * 24);
                  if (diff < 0 || diff > 7) return false;
                } else if (assignDateRange === 'Last 30 Days') {
                  const diff = (today.getTime() - subDate.getTime()) / (1000 * 3600 * 24);
                  if (diff < 0 || diff > 30) return false;
                }
              }
              return true;
            });

            const filteredTimeSpent = filtered.reduce((acc: number, a: any) => acc + (Number(a.timeTakenMinutes) || 0), 0);
            const filteredAvgTime = filtered.length > 0 ? Math.round(filteredTimeSpent / filtered.length) : 0;

            return (
              <div className="space-y-6 animate-fade-in">
                {/* SECTION A — CODING KPI SUMMARY (Overall Lifetime Metrics) */}
                <div>
                  <h3 className="text-xs font-bold uppercase text-text-muted mb-3 flex items-center gap-2">
                    <Code className="h-4 w-4 text-brand-primary" /> Overall Lifetime Coding KPI Summary
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
                    <Card className="glass-card text-center p-3"><span className="text-[10px] text-text-muted block font-bold">Total Solved</span><strong className="text-xl text-text-primary">{totalProblems}</strong></Card>
                    <Card className="glass-card text-center p-3"><span className="text-[10px] text-success block font-bold">Easy</span><strong className="text-xl text-success">{easyCount}</strong></Card>
                    <Card className="glass-card text-center p-3"><span className="text-[10px] text-warning block font-bold">Medium</span><strong className="text-xl text-warning">{mediumCount}</strong></Card>
                    <Card className="glass-card text-center p-3"><span className="text-[10px] text-danger block font-bold">Hard</span><strong className="text-xl text-danger">{hardCount}</strong></Card>
                    <Card className="glass-card text-center p-3"><span className="text-[10px] text-brand-primary block font-bold">Total Time</span><strong className="text-xl text-brand-primary">{totalTimeSpent}m</strong></Card>
                    <Card className="glass-card text-center p-3"><span className="text-[10px] text-brand-primary block font-bold">Avg Time</span><strong className="text-xl text-brand-primary">{avgTime}m</strong></Card>
                    <Card className="glass-card text-center p-3"><span className="text-[10px] text-brand-primary block font-bold">Streak</span><strong className="text-xl text-brand-primary">{currentStreak}d</strong></Card>
                    <Card className="glass-card text-center p-3"><span className="text-[10px] text-brand-primary block font-bold">Platforms</span><strong className="text-xl text-brand-primary">{platformsUsed}</strong></Card>
                  </div>
                </div>

                {/* SECTION B — CODING ACTIVITY TREND */}
                <Card className="glass-card">
                  <CardHeader><CardTitle className="text-base font-bold">Weekly Algorithmic Activity Trend</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    {totalProblems === 0 ? (
                      <div className="h-40 flex items-center justify-center text-xs text-text-muted italic">
                        No activity available yet.
                      </div>
                    ) : (
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={weeklyData}>
                            <XAxis dataKey="week" stroke="var(--text-muted)" fontSize={12} />
                            <YAxis stroke="var(--text-muted)" fontSize={12} />
                            <Tooltip contentStyle={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }} />
                            <Bar dataKey="solved" fill="var(--brand-primary)" radius={[6, 6, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* SECTION D — FILTERS */}
                <Card className="glass-card p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
                    {/* Filter 1: Date Range */}
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-text-muted mb-1">Date Range</label>
                      <select
                        value={assignDateRange}
                        onChange={(e) => setAssignDateRange(e.target.value)}
                        className="w-full rounded-lg bg-bg-surface border border-border-default px-3 py-2 text-xs text-text-primary font-medium focus:border-brand-primary"
                      >
                        <option value="All">All Dates</option>
                        <option value="Today">Today</option>
                        <option value="Yesterday">Yesterday</option>
                        <option value="Last 7 Days">Last 7 Days</option>
                        <option value="Last 30 Days">Last 30 Days</option>
                      </select>
                    </div>

                    {/* Filter 2: Technology / Tech Stack */}
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-text-muted mb-1">Tech Stack</label>
                      <select
                        value={assignTechStack}
                        onChange={(e) => setAssignTechStack(e.target.value)}
                        className="w-full rounded-lg bg-bg-surface border border-border-default px-3 py-2 text-xs text-text-primary font-medium focus:border-brand-primary"
                      >
                        <option value="All">All Tech Stacks</option>
                        <option value="JAVA">Java</option>
                        <option value="PYTHON">Python</option>
                        <option value="SQL">SQL</option>
                        <option value="SPRING_BOOT">Spring Boot</option>
                        <option value="REACT">React</option>
                        <option value="DATA_ENGINEERING">Data Engineering</option>
                        <option value="SPARK">Spark</option>
                        <option value="DSA">DSA</option>
                      </select>
                    </div>

                    {/* Filter 3: Platform */}
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-text-muted mb-1">Platform</label>
                      <select
                        value={assignPlatform}
                        onChange={(e) => setAssignPlatform(e.target.value)}
                        className="w-full rounded-lg bg-bg-surface border border-border-default px-3 py-2 text-xs text-text-primary font-medium focus:border-brand-primary"
                      >
                        <option value="All">All Platforms</option>
                        <option value="LEETCODE">LeetCode</option>
                        <option value="HACKERRANK">HackerRank</option>
                        <option value="CODECHEF">CodeChef</option>
                        <option value="GEEKSFORGEEKS">GeeksForGeeks</option>
                        <option value="CODEFORCES">Codeforces</option>
                        <option value="CUSTOM">Custom</option>
                      </select>
                    </div>

                    {/* Filter 4: Difficulty */}
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-text-muted mb-1">Difficulty</label>
                      <select
                        value={assignDifficulty}
                        onChange={(e) => setAssignDifficulty(e.target.value)}
                        className="w-full rounded-lg bg-bg-surface border border-border-default px-3 py-2 text-xs text-text-primary font-medium focus:border-brand-primary"
                      >
                        <option value="All">All Difficulties</option>
                        <option value="EASY">Easy</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HARD">Hard</option>
                      </select>
                    </div>

                    {/* Filter 5: Status */}
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-text-muted mb-1">Status</label>
                      <select
                        value={assignStatus}
                        onChange={(e) => setAssignStatus(e.target.value)}
                        className="w-full rounded-lg bg-bg-surface border border-border-default px-3 py-2 text-xs text-text-primary font-medium focus:border-brand-primary"
                      >
                        <option value="All">All Statuses</option>
                        <option value="Approved">Approved</option>
                        <option value="Pending Review">Pending Review</option>
                        <option value="Rejected">Rejected</option>
                      </select>
                    </div>

                    {/* Filter 6: Search Assignment */}
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-text-muted mb-1">Search</label>
                      <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-text-muted" />
                        <Input
                          value={assignSearch}
                          onChange={(e) => setAssignSearch(e.target.value)}
                          placeholder="Search title or repo..."
                          className="pl-8 h-8.5 text-xs bg-bg-surface border-border-default text-text-primary"
                        />
                      </div>
                    </div>
                  </div>
                </Card>

                {/* SECTION C — SUBMISSION HISTORY */}
                <Card className="glass-card overflow-hidden">
                  <div className="p-4 border-b border-border-subtle bg-bg-surface flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <h4 className="text-sm font-bold text-text-primary flex items-center gap-2">
                      <FileText className="h-4 w-4 text-brand-primary" /> Persisted Submission History
                    </h4>
                    <div className="flex items-center gap-4 text-xs">
                      <span className="text-text-secondary">
                        Showing <strong className="text-text-primary">{filtered.length}</strong> of <strong className="text-text-primary">{totalProblems}</strong> Submissions
                      </span>
                      {filtered.length > 0 && (
                        <span className="text-text-muted border-l border-border-default pl-4">
                          Filtered Time: <strong className="text-brand-primary">{filteredTimeSpent}m</strong> (Avg: <strong className="text-brand-primary">{filteredAvgTime}m</strong>)
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-border-subtle bg-bg-surface text-text-muted uppercase tracking-wider font-bold text-[10px]">
                          <th className="p-3">Problem Title</th>
                          <th className="p-3">Platform</th>
                          <th className="p-3">Tech Stack</th>
                          <th className="p-3">Difficulty</th>
                          <th className="p-3">Time Taken</th>
                          <th className="p-3">Submission Date</th>
                          <th className="p-3">Status</th>
                          <th className="p-3">Problem URL</th>
                          <th className="p-3">Evidence</th>
                          <th className="p-3">Solution Notes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-subtle">
                        {totalProblems === 0 ? (
                          <tr>
                            <td colSpan={10} className="p-12 text-center text-text-muted">
                              <Code className="mx-auto mb-3 h-10 w-10 text-text-muted opacity-60" />
                              <h3 className="text-base font-bold text-text-primary">No coding submissions recorded yet.</h3>
                              <p className="text-xs text-text-muted mt-1">Once the intern records solved problems, their metrics and history will appear here.</p>
                            </td>
                          </tr>
                        ) : filtered.length === 0 ? (
                          <tr>
                            <td colSpan={10} className="p-8 text-center text-text-muted italic">
                              No submissions match the selected filters.
                            </td>
                          </tr>
                        ) : (
                          filtered.map((a: any) => {
                            const isPending = a.status === 'PENDING' || a.status === 'PENDING_REVIEW';
                            const statusStr = (a.status === 'SOLVED' || a.status === 'APPROVED') ? 'Approved' : isPending ? 'Pending Review' : 'Rejected';
                            return (
                              <tr key={a.id} className="hover:bg-bg-surface transition-colors">
                                <td className="p-3 font-bold text-text-primary">{a.title}</td>
                                <td className="p-3"><Badge variant="outline" className="font-mono text-[10px] border-brand-primary/30 text-brand-primary">{a.platform || 'N/A'}</Badge></td>
                                <td className="p-3"><Badge variant="purple" className="font-mono text-[10px]">{a.techStack || 'N/A'}</Badge></td>
                                <td className="p-3"><Badge variant={a.difficulty?.toUpperCase() === 'HARD' ? 'destructive' : a.difficulty?.toUpperCase() === 'MEDIUM' ? 'warning' : 'success'}>{a.difficulty || 'Medium'}</Badge></td>
                                <td className="p-3 font-mono text-text-secondary">{a.timeTakenMinutes || 0} mins</td>
                                <td className="p-3 font-mono text-text-secondary">{a.submissionDate || 'Today'}</td>
                                <td className="p-3">
                                  <div className="flex items-center gap-2">
                                    <Badge variant={statusStr === 'Approved' ? 'success' : isPending ? 'warning' : 'destructive'}>{statusStr}</Badge>
                                    {isPending && (
                                      <div className="flex gap-1">
                                        <button onClick={() => approveAssignmentMutation.mutate(a.id)} className="px-2 py-0.5 rounded bg-success hover:bg-success/90 text-bg-page font-bold text-[10px]">Approve</button>
                                        <button onClick={() => rejectAssignmentMutation.mutate(a.id)} className="px-2 py-0.5 rounded bg-danger hover:bg-danger/90 text-bg-page font-bold text-[10px]">Reject</button>
                                      </div>
                                    )}
                                  </div>
                                </td>
                                <td className="p-3">
                                  {a.problemUrl ? (
                                    <a href={a.problemUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-primary hover:text-brand-primary/80">
                                      <Globe className="h-3 w-3" /> Link
                                    </a>
                                  ) : (
                                    <span className="text-text-muted">N/A</span>
                                  )}
                                </td>
                                <td className="p-3">
                                  {a.screenshotUrls && a.screenshotUrls.length > 0 ? (
                                    <button
                                      onClick={() => openSecureFile(a.screenshotUrls[0])}
                                      className="inline-flex items-center gap-1 text-[11px] font-bold text-success hover:text-success/80 bg-success/10 px-2 py-1 rounded border border-[#43D39E]/20"
                                    >
                                      <FileText className="h-3 w-3" /> Evidence
                                    </button>
                                  ) : (
                                    <span className="text-text-muted text-[11px]">No Evidence</span>
                                  )}
                                </td>
                                <td className="p-3 text-text-secondary italic max-w-xs truncate" title={a.notes || 'No notes provided.'}>
                                  "{a.notes || 'No notes provided.'}"
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>
            );
          })()}

          {/* MODULE 3: TASKS */}
          {activeModule === 'tasks' && (() => {
            const assigned = internTasks.length;
            const completed = internTasks.filter((t: any) => t.status === 'COMPLETED').length;
            const pending = assigned - completed;

            return (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Card className="glass-card p-4 text-center"><span className="text-xs text-text-muted block">Assigned</span><strong className="text-2xl text-text-primary">{assigned}</strong></Card>
                <Card className="glass-card p-4 text-center"><span className="text-xs text-success block">Completed</span><strong className="text-2xl text-success">{completed}</strong></Card>
                <Card className="glass-card p-4 text-center"><span className="text-xs text-warning block">Pending</span><strong className="text-2xl text-warning">{pending}</strong></Card>
                <Card className="glass-card p-4 text-center"><span className="text-xs text-brand-primary block">Avg Time</span><strong className="text-2xl text-brand-primary">{assigned > 0 ? '3.5 hrs' : '0 hrs'}</strong></Card>
              </div>

              <Card className="glass-card">
                <CardHeader><CardTitle className="text-base font-bold">Sprint Task Execution Timeline</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {internTasks.length === 0 ? (
                    <p className="text-xs text-text-muted text-center py-6 italic">No activity available yet.</p>
                  ) : (
                    internTasks.map((t: any) => (
                      <div key={t.id} className="flex flex-col sm:flex-row justify-between p-4 rounded-xl bg-bg-surface border border-border-default gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-text-primary">{t.taskName}</span>
                            <Badge variant={t.status === 'COMPLETED' ? 'success' : 'warning'}>{t.status}</Badge>
                          </div>
                          <p className="text-xs text-text-muted mt-1">{t.description}</p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="w-24 bg-bg-surface h-2 rounded-full overflow-hidden">
                            <div className="bg-brand-primary h-2 rounded-full" style={{ width: `${t.progress}%` }} />
                          </div>
                          <span className="font-mono text-xs font-bold text-text-secondary">{t.progress}%</span>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
            );
          })()}

          {/* MODULE 5: DUOLINGO */}
          {activeModule === 'duolingo' && (
            !internDuolingo ? (
              <Card className="glass-card p-12 text-center text-text-muted">
                <Sparkles className="mx-auto mb-3 h-10 w-10 text-warning opacity-60" />
                <h3 className="text-base font-bold text-text-primary">No Duolingo activity linked yet.</h3>
                <p className="text-xs text-text-muted mt-1">Language learning streaks and XP telemetry will appear here once connected.</p>
              </Card>
            ) : (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Card className="glass-card p-4 text-center"><span className="text-xs text-text-muted block">Current Streak</span><strong className="text-2xl text-warning">{internDuolingo.currentStreak || 0} days</strong></Card>
                <Card className="glass-card p-4 text-center"><span className="text-xs text-text-muted block">Longest Streak</span><strong className="text-2xl text-text-primary">{internDuolingo.longestStreak || internDuolingo.currentStreak || 0} days</strong></Card>
                <Card className="glass-card p-4 text-center"><span className="text-xs text-text-muted block">Total XP</span><strong className="text-2xl text-brand-primary">{internDuolingo.xp || 0} XP</strong></Card>
                <Card className="glass-card p-4 text-center"><span className="text-xs text-text-muted block">League</span><strong className="text-2xl text-success">{internDuolingo.league || 'Silver'}</strong></Card>
              </div>

              <Card className="glass-card">
                <CardHeader><CardTitle className="text-base font-bold">Weekly Duolingo Practice Graph</CardTitle></CardHeader>
                <CardContent className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={[
                      { day: 'Mon', xp: internDuolingo.xp ? Math.floor(internDuolingo.xp / 5) : 0 },
                      { day: 'Tue', xp: internDuolingo.xp ? Math.floor(internDuolingo.xp / 5) : 0 },
                      { day: 'Wed', xp: internDuolingo.xp ? Math.floor(internDuolingo.xp / 5) : 0 },
                      { day: 'Thu', xp: internDuolingo.xp ? Math.floor(internDuolingo.xp / 5) : 0 },
                      { day: 'Fri', xp: internDuolingo.xp ? Math.floor(internDuolingo.xp / 5) : 0 },
                    ]}>
                      <XAxis dataKey="day" stroke="var(--text-muted)" />
                      <YAxis stroke="var(--text-muted)" />
                      <Tooltip contentStyle={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }} />
                      <Area type="monotone" dataKey="xp" stroke="var(--warning)" fill="var(--warning)" fillOpacity={0.25} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* History Table */}
              <Card className="glass-card overflow-hidden mt-6">
                <CardHeader>
                  <CardTitle className="text-base font-bold">My Streak History</CardTitle>
                </CardHeader>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-border-default bg-bg-surface/80 text-xs uppercase text-text-muted">
                      <tr>
                        <th className="px-6 py-3">Date</th>
                        <th className="px-6 py-3">Language</th>
                        <th className="px-6 py-3">Streak Count</th>
                        <th className="px-6 py-3">XP</th>
                        <th className="px-6 py-3">Daily Goal</th>
                        <th className="px-6 py-3 text-right">Proof</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#303630]/60">
                      {allDuolingo.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-8 text-center text-text-muted">No Duolingo records yet.</td>
                        </tr>
                      ) : (
                        allDuolingo.map((d: any) => (
                          <tr key={d.id} className="hover:bg-bg-surface/40">
                            <td className="px-6 py-3 font-mono text-text-primary">{d.updateDate}</td>
                            <td className="px-6 py-3 font-semibold text-warning">{d.language}</td>
                            <td className="px-6 py-3 font-extrabold text-warning flex items-center gap-1">
                              <Flame className="h-4 w-4 fill-[#F4C95D]" /> {d.currentStreak} Days
                            </td>
                            <td className="px-6 py-3 font-mono text-text-secondary">{d.xp || 0} XP</td>
                            <td className="px-6 py-3">
                              <Badge variant="success">Completed</Badge>
                            </td>
                            <td className="px-6 py-3 text-right">
                              {d.screenshotUrl && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openSecureFile(d.screenshotUrl, 'duolingo-proof.png', false)}
                                >
                                  <ImageIcon className="h-3.5 w-3.5 text-warning" />
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
            )
          )}



          {/* MODULE 7: PROJECTS */}
          {activeModule === 'projects' && (
            !hasActivity ? (
              <Card className="glass-card p-12 text-center text-text-muted">
                <Sparkles className="mx-auto mb-3 h-10 w-10 text-brand-primary opacity-60" />
                <h3 className="text-base font-bold text-text-primary">No capstone project linked yet.</h3>
                <p className="text-xs text-text-muted mt-1">Repository and commit telemetry will show up here once assigned to an enterprise project.</p>
              </Card>
            ) : (
            <div className="space-y-4 animate-fade-in">
              <Card className="glass-card border-border-default">
                <CardContent className="p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-text-primary text-lg">Enterprise AI Gateway Microservice</h3>
                      <Badge variant="success">IN_PROGRESS</Badge>
                    </div>
                    <p className="text-xs text-text-muted mt-1">Role: Lead Full-Stack Engineer | Tech: Spring Boot 3, React, PostgreSQL</p>
                    <div className="mt-3 flex items-center gap-4 text-xs font-mono text-text-secondary">
                      <span className="flex items-center gap-1"><GitCommit className="h-4 w-4 text-brand-primary" /> 142 Commits</span>
                      <span className="flex items-center gap-1"><GitPullRequest className="h-4 w-4 text-brand-primary" /> 18 PRs Merged</span>
                      <span className="text-success">24 Issues Closed</span>
                    </div>
                  </div>
                  <a href="https://github.com" target="_blank" rel="noreferrer" className="bg-bg-surface hover:bg-bg-surface-elevated text-text-primary font-bold px-4 py-2 rounded-xl text-xs inline-flex items-center gap-2 border border-border-default">
                    <Globe className="h-4 w-4" /> Open Repository
                  </a>
                </CardContent>
              </Card>
            </div>
            )
          )}

          {/* MODULE 9: TIMELINE */}
          {activeModule === 'timeline' && (
            !hasActivity ? (
              <Card className="glass-card p-12 text-center text-text-muted">
                <Sparkles className="mx-auto mb-3 h-10 w-10 text-success opacity-60" />
                <h3 className="text-base font-bold text-text-primary">No timeline events recorded yet.</h3>
                <p className="text-xs text-text-muted mt-1">Chronological activity feed will update as assignments and tasks are logged.</p>
              </Card>
            ) : (
            <Card className="glass-card animate-fade-in">
              <CardHeader><CardTitle className="text-base font-bold">Chronological Activity Feed</CardTitle></CardHeader>
              <CardContent className="space-y-6 pl-4 border-l-2 border-border-default ml-4 py-2">
                {internAssignments.map((a: any) => (
                  <div key={a.id} className="relative pl-6">
                    <div className="absolute -left-[19px] top-1 h-3.5 w-3.5 rounded-full bg-success ring-4 ring-bg-page" />
                    <span className="text-[10px] font-mono text-text-muted">{a.submissionDate || 'Recently'}</span>
                    <h4 className="text-sm font-bold text-text-primary">Assignment Submitted: {a.title}</h4>
                    <p className="text-xs text-text-muted mt-0.5">Tech stack: {a.techStack} | Status: {a.status}</p>
                  </div>
                ))}
                {internTasks.map((t: any) => (
                  <div key={t.id} className="relative pl-6">
                    <div className="absolute -left-[19px] top-1 h-3.5 w-3.5 rounded-full bg-brand-primary ring-4 ring-bg-page" />
                    <span className="text-[10px] font-mono text-text-muted">Sprint Task</span>
                    <h4 className="text-sm font-bold text-text-primary">{t.taskName}</h4>
                    <p className="text-xs text-text-muted mt-0.5">Progress: {t.progress}% | Status: {t.status}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
            )
          )}

        </div>

        {/* ========================================== */}
        {/* 4. RIGHT PANEL: PRODUCTIVITY QUICK ACTIONS */}
        {/* ========================================== */}
        <div className="xl:col-span-1 space-y-5">
          <Card className="glass-card border-border-default bg-bg-surface shadow-2xl sticky top-6">
            <CardHeader className="pb-3 border-b border-border-subtle">
              <CardTitle className="text-sm font-black uppercase tracking-wider text-brand-primary flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" /> Manager Quick Actions
              </CardTitle>
            </CardHeader>

            <CardContent className="p-4 space-y-3">
              {selectedIntern.status === 'PENDING_APPROVAL' && (
                <>
                  <Button
                    onClick={() => approveInternMutation.mutate(selectedIntern.userId)}
                    disabled={approveInternMutation.isPending}
                    className="w-full justify-start h-10 font-bold bg-success hover:bg-success/90 text-bg-page shadow-lg transition-all"
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    {approveInternMutation.isPending ? 'Approving...' : 'Approve Intern Account'}
                  </Button>
                  <Button
                    onClick={() => {
                      if (window.confirm(`Are you sure you want to reject registration for ${selectedIntern.fullName}?`)) {
                        rejectInternMutation.mutate(selectedIntern.userId);
                      }
                    }}
                    disabled={rejectInternMutation.isPending}
                    className="w-full justify-start h-10 font-bold bg-danger hover:bg-danger/90 text-bg-page shadow-lg transition-all"
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    {rejectInternMutation.isPending ? 'Rejecting...' : 'Reject Intern Account'}
                  </Button>
                </>
              )}

              {selectedIntern.status === 'ACTIVE' && (
                <Button
                  onClick={() => {
                    if (window.confirm(`Are you sure you want to disable account for ${selectedIntern.fullName}?`)) {
                      disableInternMutation.mutate(selectedIntern.userId);
                    }
                  }}
                  disabled={disableInternMutation.isPending}
                  className="w-full justify-start h-10 font-bold bg-warning hover:bg-warning/90 text-bg-page shadow-lg transition-all"
                >
                  <Ban className="mr-2 h-4 w-4" />
                  {disableInternMutation.isPending ? 'Disabling...' : 'Disable Intern Account'}
                </Button>
              )}

              {selectedIntern.status === 'DISABLED' && (
                <Button
                  onClick={() => {
                    if (window.confirm(`Are you sure you want to enable account for ${selectedIntern.fullName}?`)) {
                      enableInternMutation.mutate(selectedIntern.userId);
                    }
                  }}
                  disabled={enableInternMutation.isPending}
                  className="w-full justify-start h-10 font-bold bg-success hover:bg-success/90 text-bg-page shadow-lg transition-all"
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  {enableInternMutation.isPending ? 'Enabling...' : 'Enable Account'}
                </Button>
              )}

              <Button
                onClick={() => {
                  if (window.confirm(`DANGER: Are you sure you want to safely delete intern ${selectedIntern.fullName} and remove all their physical files? This action cannot be undone.`)) {
                    deleteInternMutation.mutate(selectedIntern.userId);
                  }
                }}
                disabled={deleteInternMutation.isPending}
                className="w-full justify-start h-10 font-bold bg-danger/20 hover:bg-danger/30 text-danger border border-[#FF5C7A]/40 shadow transition-all"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {deleteInternMutation.isPending ? 'Deleting...' : 'Delete Intern Account'}
              </Button>

              <Button
                onClick={() => {
                  if (selectedIntern.githubUrl) {
                    window.open(selectedIntern.githubUrl, '_blank');
                  } else {
                    handleActionClick('GitHub profile not added by this mentee.');
                  }
                }}
                disabled={!selectedIntern.githubUrl}
                className="w-full justify-start h-10 font-bold bg-bg-surface hover:bg-bg-surface-elevated text-text-primary transition-all shadow border border-border-default disabled:opacity-50"
              >
                <Globe className="mr-2 h-4 w-4 text-brand-primary" />
                {selectedIntern.githubUrl ? 'View GitHub Profile' : 'GitHub Profile Not Added'}
              </Button>

              <Button
                variant="outline"
                onClick={() => {
                  if (selectedIntern.resumeUrl) {
                    openSecureFile(selectedIntern.resumeUrl, selectedIntern.resumeFileName || 'Resume.pdf', false);
                  } else {
                    handleActionClick('No resume uploaded by this intern yet.');
                  }
                }}
                className="w-full justify-start h-10 font-bold bg-bg-surface text-text-primary border-border-default hover:bg-bg-surface hover:text-text-primary transition-all shadow"
              >
                <FileText className="mr-2 h-4 w-4 text-warning" /> Open Resume / Bio
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
