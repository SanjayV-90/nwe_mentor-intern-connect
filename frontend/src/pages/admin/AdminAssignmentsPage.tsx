import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Code2, ExternalLink, Image as ImageIcon, Clock } from 'lucide-react';

export const AdminAssignmentsPage: React.FC = () => {
  const [selectedScreenshot, setSelectedScreenshot] = useState<string | null>(null);

  const { data: assignments = [], isLoading } = useQuery({
    queryKey: ['adminAssignments'],
    queryFn: async () => {
      const res = await api.get('/admin/assignments');
      return res.data.data;
    },
  });

  const getDifficultyBadge = (diff: string) => {
    switch (diff?.toUpperCase()) {
      case 'EASY':
        return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">EASY</Badge>;
      case 'MEDIUM':
        return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">MEDIUM</Badge>;
      case 'HARD':
        return <Badge className="bg-rose-500/20 text-rose-400 border-rose-500/30">HARD</Badge>;
      default:
        return <Badge>{diff || 'MEDIUM'}</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="border-b border-border-default pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-text-primary flex items-center gap-2.5">
          <Code2 className="h-6 w-6 text-purple-500" /> Problem Solving Submissions
        </h1>
        <p className="text-sm text-text-muted mt-1">
          Review coding solutions submitted by interns across LeetCode, HackerRank, and GeeksForGeeks.
        </p>
      </div>

      <Card className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border-default bg-bg-navbar/80 text-xs uppercase text-text-muted font-semibold">
              <tr>
                <th className="px-6 py-4">Intern</th>
                <th className="px-6 py-4">Problem Title & Link</th>
                <th className="px-6 py-4">Platform & Tech</th>
                <th className="px-6 py-4">Difficulty</th>
                <th className="px-6 py-4">Time Taken</th>
                <th className="px-6 py-4">Notes</th>
                <th className="px-6 py-4 text-right">Evidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-text-muted">
                    Loading problem submissions...
                  </td>
                </tr>
              ) : assignments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-text-muted">
                    No coding problems submitted yet.
                  </td>
                </tr>
              ) : (
                assignments.map((sub: any) => (
                  <tr key={sub.id} className="hover:bg-bg-surface-elevated transition-colors">
                    <td className="px-6 py-4 font-bold text-text-primary">{sub.internName}</td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-text-primary">{sub.title}</div>
                      <a
                        href={sub.problemUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center text-xs text-blue-400 hover:underline mt-0.5"
                      >
                        View Problem <ExternalLink className="ml-1 h-3 w-3" />
                      </a>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs font-bold uppercase text-purple-400">{sub.platform}</div>
                      <div className="text-xs text-text-muted mt-0.5">{sub.techStack}</div>
                    </td>
                    <td className="px-6 py-4">{getDifficultyBadge(sub.difficulty)}</td>
                    <td className="px-6 py-4 font-mono text-text-secondary">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-text-muted" /> {sub.timeTakenMinutes || 0} mins
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-text-muted max-w-xs truncate">
                      {sub.notes || '—'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {sub.screenshots && sub.screenshots.length > 0 ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedScreenshot(sub.screenshots[0].filePath)}
                        >
                          <ImageIcon className="mr-1.5 h-3.5 w-3.5 text-blue-400" /> Screenshot
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
        title="Submission Screenshot Proof"
        maxWidth="max-w-4xl"
      >
        {selectedScreenshot && (
          <div className="text-center">
            <img
              src={selectedScreenshot}
              alt="Problem Solution Evidence"
              className="mx-auto rounded-xl border border-border-default max-h-[70vh] object-contain shadow-2xl"
            />
          </div>
        )}
      </Modal>
    </div>
  );
};
