import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { CheckSquare, Plus, Sliders } from 'lucide-react';

export const InternTasksPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [progressVal, setProgressVal] = useState(0);
  const [statusVal, setStatusVal] = useState('IN_PROGRESS');
  const [actualHoursVal, setActualHoursVal] = useState(0);

  const [form, setForm] = useState({
    taskName: '',
    category: 'Backend',
    priority: 'HIGH',
    estimatedHours: 4,
    notes: '',
  });

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['myTasks', user?.userId],
    queryFn: async () => {
      const res = await api.get('/intern/tasks');
      return res.data.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => api.post('/intern/tasks', form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myTasks', user?.userId] });
      setIsNewModalOpen(false);
      setForm({ taskName: '', category: 'Backend', priority: 'HIGH', estimatedHours: 4, notes: '' });
    },
  });

  const updateProgressMutation = useMutation({
    mutationFn: async () =>
      api.patch(`/intern/tasks/${selectedTask.id}/progress`, {
        progress: progressVal,
        status: statusVal,
        actualHours: actualHoursVal,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myTasks', user?.userId] });
      setSelectedTask(null);
    },
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-default pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary flex items-center gap-2.5">
            <CheckSquare className="h-6 w-6 text-brand-primary" /> My Daily Sprint Tasks Board
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Create tasks, update progress bars, and log actual hours spent on sprint deliverables.
          </p>
        </div>
        <Button onClick={() => setIsNewModalOpen(true)} className="font-bold shadow-lg">
          <Plus className="mr-2 h-4 w-4" /> Create Task
        </Button>
      </div>

      <Card className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border-default bg-bg-surface/80 text-xs uppercase text-text-muted">
              <tr>
                <th className="px-6 py-4">Task Name & Category</th>
                <th className="px-6 py-4">Priority</th>
                <th className="px-6 py-4">Progress %</th>
                <th className="px-6 py-4">Hours (Est / Act)</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#303630]/60">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-text-muted">Loading your tasks...</td>
                </tr>
              ) : tasks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-text-muted">
                    No tasks created yet. Click "Create Task" above!
                  </td>
                </tr>
              ) : (
                tasks.map((t: any) => (
                  <tr key={t.id} className="hover:bg-bg-surface/40 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-text-primary">{t.taskName}</div>
                      <div className="text-xs text-brand-primary mt-0.5">{t.category}</div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={t.priority === 'HIGH' ? 'destructive' : t.priority === 'MEDIUM' ? 'warning' : 'default'}>
                        {t.priority}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 w-48">
                      <div className="flex justify-between text-xs mb-1 font-mono text-text-secondary">
                        <span>{t.progress}%</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-[#303630] overflow-hidden">
                        <div
                          className="h-full bg-brand-primary transition-all duration-500"
                          style={{ width: `${t.progress}%` }}
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-text-secondary">
                      {t.estimatedHours || 0}h / <span className="text-success">{t.actualHours || 0}h</span>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={t.status === 'COMPLETED' ? 'success' : t.status === 'IN_PROGRESS' ? 'default' : 'warning'}>
                        {t.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedTask(t);
                          setProgressVal(t.progress || 0);
                          setStatusVal(t.status || 'IN_PROGRESS');
                          setActualHoursVal(t.actualHours || 0);
                        }}
                      >
                        <Sliders className="mr-1.5 h-3.5 w-3.5" /> Update Progress
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* New Task Modal */}
      <Modal isOpen={isNewModalOpen} onClose={() => setIsNewModalOpen(false)} title="Create New Task">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate();
          }}
          className="space-y-4 text-sm"
        >
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">Task Deliverable Name</label>
            <Input
              required
              placeholder="e.g. Implement JWT filter chain"
              value={form.taskName}
              onChange={(e) => setForm({ ...form, taskName: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">Category</label>
              <Input
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                placeholder="Backend / Frontend / DevOps"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">Priority</label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className="flex h-10 w-full rounded-md border border-border-default bg-bg-surface px-3 text-xs text-text-primary"
              >
                <option value="HIGH">High Priority</option>
                <option value="MEDIUM">Medium Priority</option>
                <option value="LOW">Low Priority</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">Estimated Hours</label>
            <Input
              type="number"
              value={form.estimatedHours}
              onChange={(e) => setForm({ ...form, estimatedHours: parseFloat(e.target.value) || 0 })}
            />
          </div>
          <div className="pt-4 border-t border-border-default flex justify-end space-x-2">
            <Button type="button" variant="ghost" onClick={() => setIsNewModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={createMutation.isPending} className="font-bold">Save Task</Button>
          </div>
        </form>
      </Modal>

      {/* Update Progress Modal */}
      <Modal isOpen={!!selectedTask} onClose={() => setSelectedTask(null)} title="Update Task Progress & Telemetry">
        {selectedTask && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              updateProgressMutation.mutate();
            }}
            className="space-y-4 text-sm"
          >
            <div>
              <span className="text-xs text-text-muted font-semibold block">Task Name</span>
              <span className="font-bold text-text-primary text-base">{selectedTask.taskName}</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1.5">
                Progress Percentage ({progressVal}%)
              </label>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={progressVal}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setProgressVal(val);
                  if (val === 100) setStatusVal('COMPLETED');
                  else if (val > 0) setStatusVal('IN_PROGRESS');
                  else setStatusVal('PENDING');
                }}
                className="w-full accent-[#CFFF3D] cursor-pointer"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">Task Status</label>
                <select
                  value={statusVal}
                  onChange={(e) => setStatusVal(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-border-default bg-bg-surface px-3 text-xs text-text-primary"
                >
                  <option value="PENDING">Pending</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="COMPLETED">Completed</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">Actual Hours Spent</label>
                <Input
                  type="number"
                  step="0.5"
                  value={actualHoursVal}
                  onChange={(e) => setActualHoursVal(parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>

            <div className="pt-4 border-t border-border-default flex justify-end space-x-2">
              <Button type="button" variant="ghost" onClick={() => setSelectedTask(null)}>Cancel</Button>
              <Button type="submit" disabled={updateProgressMutation.isPending} className="font-bold">
                Save Progress
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
