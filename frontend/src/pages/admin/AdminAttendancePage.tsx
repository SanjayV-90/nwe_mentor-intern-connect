import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarCheck, Clock, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

export const AdminAttendancePage: React.FC = () => {
  const { data: attendanceList = [], isLoading } = useQuery({
    queryKey: ['adminAttendance'],
    queryFn: async () => {
      const res = await api.get('/admin/attendance');
      return res.data.data;
    },
    refetchInterval: 10000,
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PRESENT':
        return <Badge variant="success">PRESENT</Badge>;
      case 'HALF_DAY':
        return <Badge variant="warning">HALF DAY</Badge>;
      case 'ABSENT':
        return <Badge variant="destructive">ABSENT</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="border-b border-border-default pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-text-primary flex items-center gap-2.5">
          <CalendarCheck className="h-6 w-6 text-emerald-500" /> Batch Attendance Roster
        </h1>
        <p className="text-sm text-text-muted mt-1">
          Monitor real-time intern check-in and check-out logs across the entire batch.
        </p>
      </div>

      <Card className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border-default bg-bg-navbar/80 text-xs uppercase text-text-muted font-semibold">
              <tr>
                <th className="px-6 py-4">Intern Name & Email</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Check-in Time</th>
                <th className="px-6 py-4">Check-out Time</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-text-muted">
                    Loading attendance telemetry...
                  </td>
                </tr>
              ) : attendanceList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-text-muted">
                    No attendance logs recorded yet.
                  </td>
                </tr>
              ) : (
                attendanceList.map((record: any) => (
                  <tr key={record.id} className="hover:bg-bg-surface-elevated transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-text-primary">{record.internName}</div>
                      <div className="text-xs text-text-muted mt-0.5">{record.internEmail}</div>
                    </td>
                    <td className="px-6 py-4 font-mono text-text-secondary">{record.attendanceDate}</td>
                    <td className="px-6 py-4 font-mono text-emerald-400">
                      {record.loginTime ? new Date(record.loginTime).toLocaleTimeString() : '—'}
                    </td>
                    <td className="px-6 py-4 font-mono text-amber-400">
                      {record.logoutTime ? new Date(record.logoutTime).toLocaleTimeString() : 'In Progress'}
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(record.status)}</td>
                    <td className="px-6 py-4 text-xs text-text-muted italic">
                      {record.remarks || 'None'}
                    </td>
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
