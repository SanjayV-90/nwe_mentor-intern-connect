import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CalendarCheck, LogIn, LogOut, CheckCircle2, AlertCircle } from 'lucide-react';

export const InternAttendancePage: React.FC = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [status, setStatus] = useState<'PRESENT' | 'HALF_DAY'>('PRESENT');
  const [remarks, setRemarks] = useState('');
  const [msg, setMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const { data: attendanceHistory = [], isLoading } = useQuery({
    queryKey: ['myAttendance', user?.userId],
    queryFn: async () => {
      const res = await api.get('/intern/attendance');
      return res.data.data;
    },
  });

  const { data: summary } = useQuery({
    queryKey: ['myAttendanceSummary', user?.userId],
    queryFn: async () => {
      const res = await api.get('/intern/attendance/summary');
      return res.data?.data || null;
    },
    refetchInterval: 10000,
  });

  const checkInMutation = useMutation({
    mutationFn: async () => api.post('/intern/attendance/check-in', { status, remarks }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myAttendance', user?.userId] });
      queryClient.invalidateQueries({ queryKey: ['myAttendanceSummary', user?.userId] });
      setMsg({ text: 'Daily attendance checked in successfully!', type: 'success' });
      setRemarks('');
    },
    onError: (err: any) => {
      setMsg({ text: err.response?.data?.message || 'Check-in failed.', type: 'error' });
    },
  });

  const checkOutMutation = useMutation({
    mutationFn: async () => api.post('/intern/attendance/check-out'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myAttendance', user?.userId] });
      queryClient.invalidateQueries({ queryKey: ['myAttendanceSummary', user?.userId] });
      setMsg({ text: 'Daily attendance checked out successfully!', type: 'success' });
    },
    onError: (err: any) => {
      setMsg({ text: err.response?.data?.message || 'Check-out failed.', type: 'error' });
    },
  });

  const todayStr = new Date().toISOString().split('T')[0];
  const todayRecord = attendanceHistory.find((a: any) => a.attendanceDate === todayStr);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="border-b border-border-default pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-text-primary flex items-center gap-2.5">
          <CalendarCheck className="h-6 w-6 text-success" /> Daily Attendance Check-In
        </h1>
        <p className="text-sm text-text-muted mt-1">
          Mark your morning login check-in and evening logout check-out to maintain compliance.
        </p>
      </div>

      {msg && (
        <div
          className={`flex items-center space-x-2 rounded-xl border p-4 text-sm ${
            msg.type === 'success'
              ? 'border-[#43D39E]/40 bg-success/10 text-success'
              : 'border-[#FF5C7A]/40 bg-danger/10 text-danger'
          }`}
        >
          {msg.type === 'success' ? (
            <CheckCircle2 className="h-5 w-5 shrink-0 text-success" />
          ) : (
            <AlertCircle className="h-5 w-5 shrink-0 text-danger" />
          )}
          <span>{msg.text}</span>
        </div>
      )}

      {/* Action Card */}
      <Card className="glass-card border-success/30">
        <CardHeader>
          <CardTitle className="text-base font-bold">Today's Action Roster ({todayStr})</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-text-primary">
              Status:{' '}
              {todayRecord ? (
                !todayRecord.logoutTime && !todayRecord.checkOutTime ? (
                  <Badge className="bg-brand-primary/20 text-brand-primary border border-brand-primary/30">IN PROGRESS</Badge>
                ) : (
                  <Badge variant={todayRecord.status === 'PRESENT' ? 'success' : todayRecord.status === 'HALF_DAY' ? 'warning' : 'destructive'}>{todayRecord.status}</Badge>
                )
              ) : (
                <Badge variant="warning">NOT CHECKED IN</Badge>
              )}
            </p>
            {todayRecord && (
              <p className="text-xs text-text-muted font-mono">
                Login Time: {new Date(todayRecord.loginTime).toLocaleTimeString()}
                {todayRecord.logoutTime && ` · Logout: ${new Date(todayRecord.logoutTime).toLocaleTimeString()}`}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {!todayRecord ? (
              <>
                <select
                  value={status}
                  onChange={(e: any) => setStatus(e.target.value)}
                  className="h-10 rounded-md border border-border-default bg-bg-surface px-3 text-xs text-text-primary"
                >
                  <option value="PRESENT">Full Day Present</option>
                  <option value="HALF_DAY">Half Day Leave</option>
                </select>
                <input
                  type="text"
                  placeholder="Optional notes..."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="h-10 rounded-md border border-border-default bg-bg-surface px-3 text-xs text-text-primary"
                />
                <Button
                  onClick={() => checkInMutation.mutate()}
                  disabled={checkInMutation.isPending}
                  className="bg-success hover:bg-success/80 text-bg-page font-bold px-6"
                >
                  <LogIn className="mr-2 h-4 w-4" /> Check In Now
                </Button>
              </>
            ) : !todayRecord.logoutTime ? (
              <Button
                onClick={() => checkOutMutation.mutate()}
                disabled={checkOutMutation.isPending}
                className="bg-warning hover:bg-warning/80 text-bg-page font-bold px-6"
              >
                <LogOut className="mr-2 h-4 w-4" /> Mark Evening Check-Out
              </Button>
            ) : (
              <Badge variant="outline" className="px-4 py-2 text-xs">
                Attendance Completed for Today
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Summary KPI Cards */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
          <Card className="glass-card">
            <CardContent className="p-3 text-center">
              <span className="text-[10px] text-text-muted uppercase font-bold block">Present</span>
              <p className="text-lg font-black text-success mt-1">{summary.presentDays || 0}</p>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-3 text-center">
              <span className="text-[10px] text-text-muted uppercase font-bold block">Half-Day (0.5)</span>
              <p className="text-lg font-black text-warning mt-1">{summary.halfDays || 0}</p>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-3 text-center">
              <span className="text-[10px] text-text-muted uppercase font-bold block">Absent</span>
              <p className="text-lg font-black text-danger mt-1">{summary.absentDays || 0}</p>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-3 text-center">
              <span className="text-[10px] text-text-muted uppercase font-bold block">Approved Leave</span>
              <p className="text-lg font-black text-brand-primary mt-1">{summary.approvedLeaveDays || 0}</p>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-3 text-center">
              <span className="text-[10px] text-text-muted uppercase font-bold block">Working Days</span>
              <p className="text-lg font-black text-brand-primary mt-1">{summary.totalWorkingDays || 0}</p>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-3 text-center">
              <span className="text-[10px] text-text-muted uppercase font-bold block">Rate</span>
              <p className="text-lg font-black text-success mt-1">{summary.attendanceRate || 0}%</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* History Table */}
      <Card className="glass-card overflow-hidden">
        <CardHeader>
          <CardTitle className="text-base font-bold">Attendance Log History</CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border-default bg-bg-surface/80 text-xs uppercase text-text-muted">
              <tr>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Login Time</th>
                <th className="px-6 py-3">Logout Time</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#303630]/60">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-text-muted">Loading history...</td>
                </tr>
              ) : attendanceHistory.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-text-muted">No attendance history yet.</td>
                </tr>
              ) : (
                attendanceHistory.map((rec: any) => (
                  <tr key={rec.id} className="hover:bg-bg-surface/40">
                    <td className="px-6 py-3 font-mono text-text-primary">{rec.attendanceDate}</td>
                    <td className="px-6 py-3 font-mono text-success">
                      {rec.loginTime ? new Date(rec.loginTime).toLocaleTimeString() : '—'}
                    </td>
                    <td className="px-6 py-3 font-mono text-warning">
                      {rec.logoutTime ? new Date(rec.logoutTime).toLocaleTimeString() : 'In Progress'}
                    </td>
                    <td className="px-6 py-3">
                      {!rec.logoutTime && !rec.checkOutTime ? (
                        <Badge className="bg-brand-primary/20 text-brand-primary border border-brand-primary/30">IN PROGRESS</Badge>
                      ) : (
                        <Badge variant={rec.status === 'PRESENT' ? 'success' : rec.status === 'HALF_DAY' ? 'warning' : 'destructive'}>{rec.status}</Badge>
                      )}
                    </td>
                    <td className="px-6 py-3 text-xs text-text-muted">{rec.remarks || 'None'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
