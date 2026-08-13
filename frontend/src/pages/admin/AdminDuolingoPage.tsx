import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Flame, Award, Image as ImageIcon, Calendar } from 'lucide-react';

export const AdminDuolingoPage: React.FC = () => {
  const [selectedScreenshot, setSelectedScreenshot] = useState<string | null>(null);

  const { data: duolingoList = [], isLoading } = useQuery({
    queryKey: ['adminDuolingo'],
    queryFn: async () => {
      const res = await api.get('/admin/duolingo');
      return res.data.data;
    },
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="border-b border-border-default pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-text-primary flex items-center gap-2.5">
          <Flame className="h-6 w-6 text-amber-500" /> Duolingo Streaks Leaderboard
        </h1>
        <p className="text-sm text-text-muted mt-1">
          Review language learning consistency, daily goal completion, and screenshot verifications.
        </p>
      </div>

      <Card className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border-default bg-bg-navbar/80 text-xs uppercase text-text-muted font-semibold">
              <tr>
                <th className="px-6 py-4">Intern</th>
                <th className="px-6 py-4">Language</th>
                <th className="px-6 py-4">Current Streak</th>
                <th className="px-6 py-4">XP Earned</th>
                <th className="px-6 py-4">Daily Goal</th>
                <th className="px-6 py-4">Update Date</th>
                <th className="px-6 py-4 text-right">Proof</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-text-muted">
                    Loading streak logs...
                  </td>
                </tr>
              ) : duolingoList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-text-muted">
                    No Duolingo streak logs recorded yet.
                  </td>
                </tr>
              ) : (
                duolingoList.map((d: any) => (
                  <tr key={d.id} className="hover:bg-bg-surface-elevated transition-colors">
                    <td className="px-6 py-4 font-bold text-text-primary">{d.internName}</td>
                    <td className="px-6 py-4">
                      <span className="inline-block rounded-md bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 text-xs font-semibold text-amber-300">
                        {d.language}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 font-extrabold text-amber-400 text-base">
                        <Flame className="h-4 w-4 fill-amber-500 text-amber-500" />
                        {d.currentStreak} Days
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-text-secondary">{d.xp || 0} XP</td>
                    <td className="px-6 py-4">
                      {d.dailyGoalCompleted ? (
                        <Badge variant="success">Completed</Badge>
                      ) : (
                        <Badge variant="warning">Incomplete</Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 font-mono text-text-muted text-xs">{d.updateDate}</td>
                    <td className="px-6 py-4 text-right">
                      {d.screenshotUrl ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedScreenshot(d.screenshotUrl)}
                        >
                          <ImageIcon className="mr-1.5 h-3.5 w-3.5 text-amber-400" /> View Screenshot
                        </Button>
                      ) : (
                        <span className="text-xs text-text-muted">No screenshot</span>
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
        title="Duolingo Streak Screenshot Proof"
        maxWidth="max-w-xl"
      >
        {selectedScreenshot && (
          <div className="text-center">
            <img
              src={selectedScreenshot}
              alt="Duolingo Streak Evidence"
              className="mx-auto rounded-xl border border-border-default max-h-[70vh] object-contain shadow-2xl"
            />
          </div>
        )}
      </Modal>
    </div>
  );
};
