import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { CalendarDays, Send, Trash2, CheckCircle2, AlertCircle, Clock, FileText } from 'lucide-react';

export const InternLeavesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [leaveType, setLeaveType] = useState('SICK');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [msg, setMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const { data: leaves = [], isLoading } = useQuery({
    queryKey: ['myLeaves', user?.userId],
    queryFn: async () => {
      const res = await api.get('/intern/leaves');
      return res.data?.data || [];
    },
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!startDate || !endDate) {
        throw new Error('Please select both start date and end date.');
      }
      if (!reason || reason.trim().length < 5) {
        throw new Error('Please provide a detailed reason (at least 5 characters).');
      }
      return api.post('/intern/leaves', {
        leaveType,
        startDate,
        endDate,
        reason,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myLeaves', user?.userId] });
      queryClient.invalidateQueries({ queryKey: ['myAttendanceSummary', user?.userId] });
      setMsg({ text: 'Leave request submitted successfully for review!', type: 'success' });
      setStartDate('');
      setEndDate('');
      setReason('');
      setTimeout(() => setMsg(null), 4000);
    },
    onError: (err: any) => {
      setMsg({ text: err.message || err.response?.data?.message || 'Failed to submit leave request.', type: 'error' });
      setTimeout(() => setMsg(null), 5000);
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/intern/leaves/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myLeaves', user?.userId] });
      queryClient.invalidateQueries({ queryKey: ['myAttendanceSummary', user?.userId] });
      setMsg({ text: 'Leave request cancelled successfully.', type: 'success' });
      setTimeout(() => setMsg(null), 4000);
    },
    onError: (err: any) => {
      setMsg({ text: err.response?.data?.message || 'Failed to cancel leave request.', type: 'error' });
      setTimeout(() => setMsg(null), 5000);
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <Badge variant="success">APPROVED</Badge>;
      case 'PENDING':
        return <Badge variant="warning">PENDING REVIEW</Badge>;
      case 'REJECTED':
        return <Badge variant="destructive">REJECTED</Badge>;
      case 'CANCELLED':
        return <Badge variant="outline">CANCELLED</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="border-b border-border-default pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-text-primary flex items-center gap-2.5">
          <CalendarDays className="h-6 w-6 text-brand-primary" /> Leave & Time Off Applications
        </h1>
        <p className="text-sm text-text-muted mt-1">
          Submit leave requests in advance for Batch Manager review and track approval status.
        </p>
      </div>

      {msg && (
        <div
          className={`flex items-center space-x-2 rounded-xl border p-4 text-sm font-medium ${
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Submit Form Card */}
        <Card className="glass-card border-brand-primary/30 lg:col-span-1 sticky top-6">
          <CardHeader className="pb-4 border-b border-border-default">
            <CardTitle className="text-base font-bold text-text-primary flex items-center gap-2">
              <Send className="h-4 w-4 text-brand-primary" /> Submit New Request
            </CardTitle>
            <CardDescription className="text-xs text-text-muted">
              Approved leaves are excluded from absent days calculations.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div>
              <label className="text-xs font-semibold text-text-secondary block mb-1.5">Leave Type</label>
              <select
                value={leaveType}
                onChange={(e) => setLeaveType(e.target.value)}
                className="w-full h-10 rounded-lg border border-border-default bg-bg-surface px-3 text-xs text-text-primary focus:border-brand-primary"
              >
                <option value="SICK">Sick Leave</option>
                <option value="CASUAL">Casual Leave</option>
                <option value="PERSONAL">Personal Leave</option>
                <option value="EMERGENCY">Emergency Leave</option>
                <option value="OTHER">Other Leave</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-text-secondary block mb-1.5">Start Date</label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-bg-surface border-border-default text-xs text-text-primary"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-text-secondary block mb-1.5">End Date</label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-bg-surface border-border-default text-xs text-text-primary"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-text-secondary block mb-1.5">Reason for Leave</label>
              <textarea
                rows={3}
                placeholder="Provide details about your leave application..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full rounded-lg border border-border-default bg-bg-surface p-3 text-xs text-text-primary placeholder:text-text-muted focus:border-brand-primary focus:outline-none"
              />
            </div>

            <Button
              onClick={() => submitMutation.mutate()}
              disabled={submitMutation.isPending}
              className="w-full bg-brand-primary hover:bg-brand-primary/80 font-bold h-10 text-bg-page shadow-lg shadow-[#CFFF3D]/20"
            >
              <Send className="mr-2 h-4 w-4" />
              {submitMutation.isPending ? 'Submitting...' : 'Submit Application'}
            </Button>
          </CardContent>
        </Card>

        {/* History Table Card */}
        <Card className="glass-card overflow-hidden lg:col-span-2">
          <CardHeader className="pb-4 border-b border-border-default">
            <CardTitle className="text-base font-bold text-text-primary flex items-center gap-2">
              <Clock className="h-4 w-4 text-success" /> My Leave Application History
            </CardTitle>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border-default bg-bg-surface/80 text-xs uppercase text-text-muted font-semibold">
                <tr>
                  <th className="px-5 py-3.5">Dates</th>
                  <th className="px-5 py-3.5">Type & Days</th>
                  <th className="px-5 py-3.5">Reason</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Review Remarks</th>
                  <th className="px-5 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#303630]/60">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-text-muted text-xs">
                      Loading applications...
                    </td>
                  </tr>
                ) : leaves.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-text-muted text-xs italic">
                      No leave applications submitted yet.
                    </td>
                  </tr>
                ) : (
                  leaves.map((l: any) => (
                    <tr key={l.id} className="hover:bg-bg-surface/40 transition-colors">
                      <td className="px-5 py-3.5 font-mono text-xs text-text-primary">
                        <div className="font-bold">{l.startDate}</div>
                        {l.startDate !== l.endDate && <div className="text-text-muted">to {l.endDate}</div>}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="font-bold text-xs text-brand-primary block">{l.leaveType}</span>
                        <span className="text-[10px] text-text-muted font-mono">
                          {l.workingLeaveDays} {l.workingLeaveDays === 1 ? 'day' : 'days'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-text-secondary max-w-xs truncate" title={l.reason}>
                        {l.reason}
                      </td>
                      <td className="px-5 py-3.5">{getStatusBadge(l.status)}</td>
                      <td className="px-5 py-3.5 text-xs text-text-muted max-w-xs truncate" title={l.adminComments || 'None'}>
                        {l.adminComments ? (
                          <span className="text-text-primary italic">"{l.adminComments}"</span>
                        ) : (
                          <span className="text-text-muted">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        {l.status === 'PENDING' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-danger hover:text-danger/80 hover:bg-danger/10 h-8 px-2.5 text-xs"
                            onClick={() => cancelMutation.mutate(l.id)}
                            disabled={cancelMutation.isPending}
                          >
                            <Trash2 className="mr-1 h-3.5 w-3.5" /> Cancel
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
    </div>
  );
};

export default InternLeavesPage;
