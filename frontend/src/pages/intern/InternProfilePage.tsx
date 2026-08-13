import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api, { openSecureFile } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  UserCheck, Code, GraduationCap, CheckCircle2, Upload, Trash2,
  FileText, Download, Eye, User as UserIcon, Camera, AlertCircle
} from 'lucide-react';

export const InternProfilePage: React.FC = () => {
  const queryClient = useQueryClient();
  const { user, updateUserSession } = useAuth();
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const resumeInputRef = useRef<HTMLInputElement | null>(null);

  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [selectedPhotoFile, setSelectedPhotoFile] = useState<File | null>(null);

  const [form, setForm] = useState({
    phone: '',
    address: '',
    currentTechStack: '',
    primarySkill: '',
    secondarySkill: '',
    githubUrl: '',
    linkedinUrl: '',
  });

  const { data: profile, isLoading } = useQuery({
    queryKey: ['myProfile', user?.userId],
    queryFn: async () => {
      const res = await api.get('/intern/profile/me');
      const d = res.data.data;
      setForm({
        phone: d.phone || '',
        address: d.address || '',
        currentTechStack: d.currentTechStack || '',
        primarySkill: d.primarySkill || '',
        secondarySkill: d.secondarySkill || '',
        githubUrl: d.githubUrl || '',
        linkedinUrl: d.linkedinUrl || '',
      });
      const photoUrl = d.profilePictureUrl;
      if (photoUrl) {
        updateUserSession({ profilePictureUrl: photoUrl });
      }
      return d;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (updatedData: any) => api.put('/intern/profile/me', updatedData),
    onSuccess: () => {
      queryClient.invalidateQueries();
      setSuccessMsg('Profile skills and links updated successfully!');
      setTimeout(() => setSuccessMsg(null), 4000);
    },
  });

  const photoUploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/intern/profile/picture', formData);
      return res.data.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries();
      const newUrl = data?.profilePictureUrl;
      if (newUrl) {
        updateUserSession({ profilePictureUrl: newUrl });
      }
      setSuccessMsg('Profile photo updated successfully!');
      setSelectedPhotoFile(null);
      setPhotoPreview(null);
      setTimeout(() => setSuccessMsg(null), 4000);
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.message || 'Failed to upload photo');
      setTimeout(() => setErrorMsg(null), 4000);
    },
  });

  const photoDeleteMutation = useMutation({
    mutationFn: async () => api.delete('/intern/profile/picture'),
    onSuccess: () => {
      queryClient.invalidateQueries();
      updateUserSession({ profilePictureUrl: undefined });
      setSuccessMsg('Profile photo removed successfully!');
      setTimeout(() => setSuccessMsg(null), 4000);
    },
  });

  const resumeUploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/intern/profile/resume', formData);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      setSuccessMsg('Resume uploaded successfully!');
      setTimeout(() => setSuccessMsg(null), 4000);
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.message || 'Failed to upload resume');
      setTimeout(() => setErrorMsg(null), 4000);
    },
  });

  const resumeDeleteMutation = useMutation({
    mutationFn: async () => api.delete('/intern/profile/resume'),
    onSuccess: () => {
      queryClient.invalidateQueries();
      setSuccessMsg('Resume deleted successfully!');
      setTimeout(() => setSuccessMsg(null), 4000);
    },
  });

  if (isLoading) {
    return <div className="p-12 text-center text-text-muted">Loading developer profile...</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-default pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary flex items-center gap-2.5">
            <UserCheck className="h-6 w-6 text-brand-primary" /> Engineer Profile & Technical Competencies
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Keep your skills, tech stack, and developer links current for batch evaluations.
          </p>
        </div>
        <div>
          <Badge variant="success" className="px-3 py-1.5 text-xs font-bold">
            {profile?.status} ENGINEER
          </Badge>
        </div>
      </div>

      {successMsg && (
        <div className="flex items-center space-x-2 rounded-xl border border-[#43D39E]/40 bg-success/10 p-4 text-sm text-success">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-success" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center space-x-2 rounded-xl border border-[#FF5C7A]/40 bg-danger/10 p-4 text-sm text-danger">
          <AlertCircle className="h-5 w-5 shrink-0 text-danger" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Photo, Credentials & Resume */}
        <div className="space-y-6 lg:col-span-1">
          {/* Profile Photo Card */}
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Camera className="h-5 w-5 text-brand-primary" /> Profile Photo
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <div className="relative mx-auto h-28 w-28 rounded-full overflow-hidden border-2 border-brand-primary/40 bg-bg-surface flex items-center justify-center shadow-xl">
                {photoPreview ? (
                  <img src={photoPreview} alt="Preview" className="h-full w-full object-cover" />
                ) : profile?.profilePictureUrl ? (
                  <img src={profile.profilePictureUrl} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <UserIcon className="h-12 w-12 text-text-muted" />
                )}
              </div>
              <input
                type="file"
                ref={photoInputRef}
                accept=".jpg,.jpeg,.png"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) {
                    if (f.size > 5 * 1024 * 1024) {
                      setErrorMsg('Photo file size exceeds maximum limit of 5 MB');
                      setTimeout(() => setErrorMsg(null), 4000);
                      return;
                    }
                    setSelectedPhotoFile(f);
                    setPhotoPreview(URL.createObjectURL(f));
                  }
                }}
              />
              {photoPreview && selectedPhotoFile ? (
                <div className="flex justify-center gap-2">
                  <Button
                    size="sm"
                    disabled={photoUploadMutation.isPending}
                    onClick={() => photoUploadMutation.mutate(selectedPhotoFile)}
                  >
                    {photoUploadMutation.isPending ? 'Saving...' : 'Save Photo'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedPhotoFile(null);
                      setPhotoPreview(null);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full font-semibold"
                    onClick={() => photoInputRef.current?.click()}
                  >
                    <Upload className="mr-2 h-4 w-4 text-brand-primary" />
                    {profile?.profilePictureUrl ? 'Change Photo' : 'Upload Photo'}
                  </Button>
                  {profile?.profilePictureUrl && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-danger hover:text-danger/80 hover:bg-danger/10"
                      disabled={photoDeleteMutation.isPending}
                      onClick={() => photoDeleteMutation.mutate()}
                    >
                      <Trash2 className="mr-2 h-4 w-4" /> Remove Photo
                    </Button>
                  )}
                  <p className="text-[11px] text-text-muted">JPG, JPEG or PNG. Max size 5 MB.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Onboarding Credentials */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-base font-bold">Onboarding Credentials</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <span className="text-xs text-text-muted font-semibold block">Full Name</span>
                <span className="font-bold text-text-primary text-lg">{profile?.fullName}</span>
              </div>

              <div>
                <span className="text-xs text-text-muted font-semibold block">Email</span>
                <span className="text-text-secondary">{profile?.email}</span>
              </div>
              <div className="border-t border-border-default pt-3">
                <span className="text-xs text-text-muted font-semibold block flex items-center gap-1 mb-1">
                  <GraduationCap className="h-4 w-4 text-success" /> Academic Institution
                </span>
                <p className="font-semibold text-text-primary">{profile?.college}</p>
                <p className="text-xs text-text-muted">{profile?.degree} · {profile?.department}</p>
              </div>
              <div className="border-t border-border-default pt-3">
                <span className="text-xs text-text-muted font-semibold block mb-1">Onboarding Dates</span>
                <p className="text-xs text-text-muted">Joined: {profile?.joiningDate || 'N/A'}</p>
              </div>
            </CardContent>
          </Card>

          {/* Resume Management Card */}
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <FileText className="h-5 w-5 text-brand-primary" /> Resume / CV Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <input
                type="file"
                ref={resumeInputRef}
                accept=".pdf"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) {
                    if (f.size > 5 * 1024 * 1024) {
                      setErrorMsg('Resume file size exceeds maximum limit of 5 MB');
                      setTimeout(() => setErrorMsg(null), 4000);
                      return;
                    }
                    resumeUploadMutation.mutate(f);
                  }
                }}
              />
              {profile?.resumeUrl ? (
                <div className="space-y-3">
                  <div className="rounded-xl border border-border-default bg-bg-surface/60 p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <FileText className="h-6 w-6 text-brand-primary shrink-0" />
                      <div className="truncate">
                        <p className="font-semibold text-text-primary text-xs truncate">
                          {profile.resumeFileName || 'Resume.pdf'}
                        </p>
                        {profile.resumeUploadedAt && (
                          <p className="text-[10px] text-text-muted">
                            Uploaded: {new Date(profile.resumeUploadedAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openSecureFile(profile.resumeUrl, profile.resumeFileName || 'Resume.pdf', false)}
                    >
                      <Eye className="mr-1.5 h-3.5 w-3.5 text-brand-primary" /> View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openSecureFile(profile.resumeUrl, profile.resumeFileName || 'Resume.pdf', true)}
                    >
                      <Download className="mr-1.5 h-3.5 w-3.5 text-success" /> Download
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-text-secondary hover:text-text-primary"
                      disabled={resumeUploadMutation.isPending}
                      onClick={() => resumeInputRef.current?.click()}
                    >
                      Replace
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-danger hover:text-danger/80 hover:bg-danger/10"
                      disabled={resumeDeleteMutation.isPending}
                      onClick={() => resumeDeleteMutation.mutate()}
                    >
                      <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center space-y-3 py-3">
                  <p className="text-xs text-text-muted">No resume uploaded yet.</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full font-semibold"
                    disabled={resumeUploadMutation.isPending}
                    onClick={() => resumeInputRef.current?.click()}
                  >
                    <Upload className="mr-2 h-4 w-4 text-brand-primary" />
                    {resumeUploadMutation.isPending ? 'Uploading...' : 'Upload Resume (PDF)'}
                  </Button>
                  <p className="text-[11px] text-text-muted">PDF format only. Maximum size 5 MB.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column: Editable skills and links */}
        <Card className="glass-card lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Code className="h-5 w-5 text-brand-primary" /> Update Technical Stack & Links
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateMutation.mutate(form);
              }}
              className="space-y-4 text-sm"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">Primary Skill</label>
                  <Input
                    value={form.primarySkill}
                    onChange={(e) => setForm({ ...form, primarySkill: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">Secondary Skill</label>
                  <Input
                    value={form.secondarySkill}
                    onChange={(e) => setForm({ ...form, secondarySkill: e.target.value })}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-text-secondary mb-1">Current Tech Stack</label>
                  <Input
                    value={form.currentTechStack}
                    onChange={(e) => setForm({ ...form, currentTechStack: e.target.value })}
                    placeholder="Java, Spring Boot, React, TypeScript..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">GitHub Profile URL</label>
                  <Input
                    value={form.githubUrl}
                    onChange={(e) => setForm({ ...form, githubUrl: e.target.value })}
                    placeholder="https://github.com/username"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">LinkedIn Profile URL</label>
                  <Input
                    value={form.linkedinUrl}
                    onChange={(e) => setForm({ ...form, linkedinUrl: e.target.value })}
                    placeholder="https://linkedin.com/in/username"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">Contact Phone</label>
                  <Input
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">Residential Address</label>
                  <Input
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-border-default flex justify-end">
                <Button type="submit" disabled={updateMutation.isPending} className="font-bold px-6">
                  {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
