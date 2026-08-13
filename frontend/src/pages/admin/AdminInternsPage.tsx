import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import {
  Users,
  Search,
  CheckCircle,
  XCircle,
  ShieldBan,
  Eye,
  Globe,
  Link2,
  MapPin,
  GraduationCap,
  Code,
  Trash2,
} from 'lucide-react';

export const AdminInternsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [selectedIntern, setSelectedIntern] = useState<any | null>(null);

  const { data: internsPage, isLoading } = useQuery({
    queryKey: ['adminInterns', statusFilter, search],
    queryFn: async () => {
      const params: any = {};
      if (statusFilter) params.status = statusFilter;
      if (search) params.search = search;
      const res = await api.get('/admin/interns', { params });
      return res.data.data;
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

  const approveMutation = useMutation({
    mutationFn: async (userId: string) => api.patch(`/admin/interns/${userId}/approve`),
    onSuccess: () => {
      invalidateAllAdminQueries();
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (userId: string) => api.patch(`/admin/interns/${userId}/reject`),
    onSuccess: () => {
      invalidateAllAdminQueries();
    },
  });

  const disableMutation = useMutation({
    mutationFn: async (userId: string) => api.patch(`/admin/interns/${userId}/disable`),
    onSuccess: () => {
      invalidateAllAdminQueries();
    },
  });

  const enableMutation = useMutation({
    mutationFn: async (userId: string) => api.patch(`/admin/interns/${userId}/enable`),
    onSuccess: () => {
      invalidateAllAdminQueries();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (userId: string) => api.delete(`/admin/interns/${userId}`),
    onSuccess: () => {
      invalidateAllAdminQueries();
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge variant="success">ACTIVE</Badge>;
      case 'PENDING_APPROVAL':
        return <Badge variant="warning">PENDING APPROVAL</Badge>;
      case 'REJECTED':
        return <Badge variant="destructive">REJECTED</Badge>;
      case 'DISABLED':
        return <Badge variant="outline">DISABLED</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const interns = internsPage?.content || [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-default pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary flex items-center gap-2.5">
            <Users className="h-6 w-6 text-blue-500" /> Intern Management Roster
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Review onboarding applications, approve intern accounts, and monitor developer profiles.
          </p>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <Card className="glass-card">
        <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-text-muted" />
            <Input
              placeholder="Search by name, email, college, tech..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex items-center space-x-2 w-full md:w-auto">
            <span className="text-xs font-semibold text-text-muted">Filter Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 rounded-md border border-border-default bg-bg-input px-3 text-xs text-text-primary focus:ring-2 focus:ring-brand-primary"
            >
              <option value="">All Statuses</option>
              <option value="PENDING_APPROVAL">Pending Approval</option>
              <option value="ACTIVE">Active Engineers</option>
              <option value="REJECTED">Rejected</option>
              <option value="DISABLED">Disabled</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Intern Table */}
      <Card className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border-default bg-bg-navbar/80 text-xs uppercase text-text-muted font-semibold">
              <tr>
                <th className="px-6 py-4">Intern ID & Name</th>
                <th className="px-6 py-4">Contact</th>
                <th className="px-6 py-4">College & Dept</th>
                <th className="px-6 py-4">Primary Tech</th>
                <th className="px-6 py-4">Account Status</th>
                <th className="px-6 py-4 text-right">Manager Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-text-muted">
                    <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent mr-2" />
                    Loading intern records...
                  </td>
                </tr>
              ) : interns.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-text-muted">
                    No interns found matching your filter parameters.
                  </td>
                </tr>
              ) : (
                interns.map((profile: any) => (
                  <tr key={profile.id} className="hover:bg-bg-surface-elevated transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-text-primary">{profile.fullName}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-text-secondary">{profile.email}</div>
                      <div className="text-xs text-text-muted mt-0.5">{profile.phone || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-text-secondary font-medium">{profile.college}</div>
                      <div className="text-xs text-text-muted mt-0.5">{profile.degree}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-block rounded-md bg-purple-500/10 border border-purple-500/20 px-2 py-1 text-xs font-semibold text-purple-300">
                        {profile.primarySkill}
                      </span>
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(profile.status)}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedIntern(profile)}
                          title="View Full Profile"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>

                        {profile.status === 'PENDING_APPROVAL' && (
                          <>
                            <Button
                              size="sm"
                              className="bg-success hover:bg-success/90 text-bg-page font-bold"
                              onClick={() => approveMutation.mutate(profile.userId)}
                              disabled={approveMutation.isPending}
                            >
                              <CheckCircle className="mr-1 h-3.5 w-3.5" /> Approve
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => rejectMutation.mutate(profile.userId)}
                              disabled={rejectMutation.isPending}
                            >
                              <XCircle className="mr-1 h-3.5 w-3.5" /> Reject
                            </Button>
                          </>
                        )}

                        {profile.status === 'ACTIVE' && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-rose-500/30 text-rose-400 hover:bg-rose-500/10"
                            onClick={() => {
                              if (window.confirm(`Are you sure you want to disable account for ${profile.fullName}?`)) {
                                disableMutation.mutate(profile.userId);
                              }
                            }}
                            title="Disable Account"
                          >
                            <ShieldBan className="h-4 w-4" />
                          </Button>
                        )}

                        {profile.status === 'DISABLED' && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                            onClick={() => {
                              if (window.confirm(`Are you sure you want to enable account for ${profile.fullName}?`)) {
                                enableMutation.mutate(profile.userId);
                              }
                            }}
                            title="Enable Account"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}

                        <Button
                          variant="outline"
                          size="sm"
                          className="border-rose-500/50 text-rose-400 hover:bg-rose-500/20"
                          onClick={() => {
                            if (window.confirm(`DANGER: Are you sure you want to safely delete intern ${profile.fullName} and remove all their physical files? This action cannot be undone.`)) {
                              deleteMutation.mutate(profile.userId);
                            }
                          }}
                          title="Delete Account & Files"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Intern Profile Modal */}
      <Modal
        isOpen={!!selectedIntern}
        onClose={() => setSelectedIntern(null)}
        title={selectedIntern ? `Developer Profile: ${selectedIntern.fullName}` : ''}
        maxWidth="max-w-2xl"
      >
        {selectedIntern && (
          <div className="space-y-6 text-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-bg-surface/60 p-4 rounded-xl border border-border-default">

              <div>
                <span className="text-xs text-text-muted font-semibold block">Status</span>
                <div className="mt-1">{getStatusBadge(selectedIntern.status)}</div>
              </div>
              <div>
                <span className="text-xs text-text-muted font-semibold block">Email</span>
                <span className="text-text-secondary">{selectedIntern.email}</span>
              </div>
              <div>
                <span className="text-xs text-text-muted font-semibold block">Phone</span>
                <span className="text-text-secondary">{selectedIntern.phone || 'N/A'}</span>
              </div>
            </div>

            <div className="border-t border-border-default pt-4">
              <h4 className="font-bold text-text-primary flex items-center gap-2 mb-3">
                <GraduationCap className="h-4 w-4 text-emerald-400" /> Academic Credentials
              </h4>
              <div className="grid grid-cols-2 gap-3 text-text-secondary">
                <p><strong className="text-text-muted">College:</strong> {selectedIntern.college}</p>
                <p><strong className="text-text-muted">Degree:</strong> {selectedIntern.degree}</p>
                <p><strong className="text-text-muted">Dept:</strong> {selectedIntern.department}</p>
                <p><strong className="text-text-muted">DOB:</strong> {selectedIntern.dob || 'N/A'}</p>
              </div>
            </div>

            <div className="border-t border-border-default pt-4">
              <h4 className="font-bold text-text-primary flex items-center gap-2 mb-3">
                <Code className="h-4 w-4 text-purple-400" /> Technical Competencies
              </h4>
              <p className="mb-2"><strong className="text-text-muted">Primary Skill:</strong> <span className="text-purple-400 font-bold">{selectedIntern.primarySkill}</span></p>
              <p className="mb-2"><strong className="text-text-muted">Secondary Skill:</strong> {selectedIntern.secondarySkill || 'None'}</p>
              <p><strong className="text-text-muted">Tech Stack:</strong> <span className="text-text-secondary">{selectedIntern.currentTechStack}</span></p>
            </div>

            <div className="border-t border-border-default pt-4 flex flex-wrap gap-4">
              {selectedIntern.githubUrl && (
                <a
                  href={selectedIntern.githubUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center space-x-2 rounded-lg bg-bg-surface-elevated px-3 py-2 text-xs font-semibold text-text-primary hover:bg-bg-surface-elevated/80"
                >
                  <Globe className="h-4 w-4" /> <span>GitHub Profile</span>
                </a>
              )}
              {selectedIntern.linkedinUrl && (
                <a
                  href={selectedIntern.linkedinUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center space-x-2 rounded-lg bg-blue-600/20 border border-blue-500/30 px-3 py-2 text-xs font-semibold text-blue-300 hover:bg-blue-600/30"
                >
                  <Link2 className="h-4 w-4" /> <span>LinkedIn Profile</span>
                </a>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
