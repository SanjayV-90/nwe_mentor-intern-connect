import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckSquare, AlertCircle } from 'lucide-react';

export const AdminTasksPage: React.FC = () => {
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['adminTasks'],
    queryFn: async () => {
      const res = await api.get('/admin/tasks');
      return res.data.data;
    },
  });

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return <Badge className="bg-rose-500/20 text-rose-400 border-rose-500/30">HIGH</Badge>;
      case 'MEDIUM':
        return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">MEDIUM</Badge>;
      case 'LOW':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">LOW</Badge>;
      default:
        return <Badge>{priority}</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="border-b border-border-default pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-text-primary flex items-center gap-2.5">
          <CheckSquare className="h-6 w-6 text-blue-500" /> Batch Tasks Board
        </h1>
        <p className="text-sm text-text-muted mt-1">
          Track sprint progress, task priorities, and completion velocity across all interns.
        </p>
      </div>

      <Card className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border-default bg-bg-navbar/80 text-xs uppercase text-text-muted font-semibold">
              <tr>
                <th className="px-6 py-4">Intern</th>
                <th className="px-6 py-4">Task Name & Category</th>
                <th className="px-6 py-4">Priority</th>
                <th className="px-6 py-4">Progress</th>
                <th className="px-6 py-4">Hours (Est / Act)</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-text-muted">
                    Loading sprint tasks...
                  </td>
                </tr>
              ) : tasks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-text-muted">
                    No tasks assigned or created yet.
                  </td>
                </tr>
              ) : (
                tasks.map((t: any) => (
                  <tr key={t.id} className="hover:bg-bg-surface-elevated transition-colors">
                    <td className="px-6 py-4 font-bold text-text-primary">{t.internName}</td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-text-primary">{t.taskName}</div>
                      <div className="text-xs text-blue-400 mt-0.5">{t.category}</div>
                    </td>
                    <td className="px-6 py-4">{getPriorityBadge(t.priority)}</td>
                    <td className="px-6 py-4 w-48">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-mono text-text-secondary">{t.progress}%</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${
                            t.progress === 100
                              ? 'bg-emerald-500'
                              : t.progress > 50
                              ? 'bg-blue-500'
                              : 'bg-amber-500'
                          }`}
                          style={{ width: `${t.progress}%` }}
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-text-secondary">
                      {t.estimatedHours || 0}h / <span className="text-emerald-400">{t.actualHours || 0}h</span>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={t.status === 'COMPLETED' ? 'success' : t.status === 'IN_PROGRESS' ? 'default' : 'warning'}>
                        {t.status}
                      </Badge>
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
