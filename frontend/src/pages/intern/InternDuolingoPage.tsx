import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { Flame, UploadCloud, CheckCircle2, Award, Image as ImageIcon } from 'lucide-react';

export const InternDuolingoPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [selectedScreenshot, setSelectedScreenshot] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [form, setForm] = useState({
    currentStreak: 0,
    language: '',
    xp: 0,
    dailyGoalCompleted: true,
  });

  const { data: duolingoHistory = [], isLoading } = useQuery({
    queryKey: ['myDuolingo', user?.userId],
    queryFn: async () => {
      const res = await api.get('/intern/duolingo');
      return res.data.data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      formData.append('data', new Blob([JSON.stringify(form)], { type: 'application/json' }));
      if (file) {
        formData.append('screenshot', file);
      }
      const res = await api.post('/intern/duolingo', formData);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myDuolingo', user?.userId] });
      queryClient.invalidateQueries({ queryKey: ['adminDashboard'] });
      setMsg('Daily Duolingo streak verified and recorded successfully!');
      setTimeout(() => setMsg(null), 4000);
      setFile(null);
      setForm({
        currentStreak: 0,
        language: '',
        xp: 0,
        dailyGoalCompleted: true,
      });
    },
    onError: (err: any) => {
      const errorText = err.response?.data?.message || 'Failed to record Duolingo streak. Please try again.';
      alert(errorText);
    },
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="border-b border-border-default pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-text-primary flex items-center gap-2.5">
          <Flame className="h-6 w-6 text-warning fill-[#F4C95D]" /> Duolingo Streak Log & Telemetry
        </h1>
        <p className="text-sm text-text-muted mt-1">
          Maintain daily foreign language learning habits. Upload screenshot proof to earn batch rewards.
        </p>
      </div>

      {msg && (
        <div className="flex items-center space-x-2 rounded-xl border border-[#43D39E]/40 bg-success/10 p-4 text-sm text-success">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-success" />
          <span>{msg}</span>
        </div>
      )}

      {/* Action Card */}
      <Card className="glass-card border-warning/30">
        <CardHeader>
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Award className="h-5 w-5 text-warning" /> Log Today's Duolingo Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              updateMutation.mutate();
            }}
            className="space-y-4 text-sm"
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">Current Day Streak</label>
                <Input
                  type="number"
                  value={form.currentStreak}
                  onChange={(e) => setForm({ ...form, currentStreak: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">Language Being Learned</label>
                <Input
                  value={form.language}
                  onChange={(e) => setForm({ ...form, language: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">Total XP Earned</label>
                <Input
                  type="number"
                  value={form.xp}
                  onChange={(e) => setForm({ ...form, xp: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">Upload Daily Screenshot Proof</label>
              <label className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border-default bg-bg-surface/50 p-4 cursor-pointer hover:border-[#F4C95D]/50 transition-colors">
                <UploadCloud className="h-6 w-6 text-warning mb-1" />
                <span className="text-xs text-text-secondary">
                  {file ? file.name : 'Click to attach Duolingo app streak screenshot (.png / .jpg)'}
                </span>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => e.target.files && setFile(e.target.files[0])}
                />
              </label>
            </div>

            <div className="pt-4 border-t border-border-default flex justify-end">
              <Button
                type="submit"
                disabled={updateMutation.isPending}
                className="bg-warning hover:bg-warning/80 font-bold px-6 text-bg-page shadow-lg shadow-[#F4C95D]/20"
              >
                <Flame className="mr-2 h-4 w-4 fill-[#111311]" />
                {updateMutation.isPending ? 'Logging Streak...' : 'Verify & Log Daily Streak'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* History Table */}
      <Card className="glass-card overflow-hidden">
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
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-text-muted">Loading your streaks...</td>
                </tr>
              ) : duolingoHistory.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-text-muted">No streak logs found.</td>
                </tr>
              ) : (
                duolingoHistory.map((d: any) => (
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
                          onClick={() => setSelectedScreenshot(d.screenshotUrl)}
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

      <Modal
        isOpen={!!selectedScreenshot}
        onClose={() => setSelectedScreenshot(null)}
        title="Duolingo Screenshot Proof"
        maxWidth="max-w-xl"
      >
        {selectedScreenshot && (
          <div className="text-center">
            <img
              src={selectedScreenshot}
              alt="Duolingo Evidence"
              className="mx-auto rounded-xl border border-border-default max-h-[70vh] object-contain shadow-2xl"
            />
          </div>
        )}
      </Modal>
    </div>
  );
};
