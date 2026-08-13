import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Shield, Lock, Mail, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginForm = z.infer<typeof loginSchema>;

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { loginSession } = useAuth();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const response = await api.post('/auth/login', data);
      const authData = response.data.data;
      loginSession(authData);
      if (authData.role === 'ADMIN') {
        navigate('/admin/dashboard');
      } else {
        navigate('/intern/dashboard');
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-bg-page p-4 relative overflow-hidden">
      {/* Glow background effects */}
      <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-brand-primary/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-brand-primary/5 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10 animate-fade-in">
        <div className="text-center mb-6">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-bg-surface border border-border-default shadow-xl shadow-[#CFFF3D]/10 mb-3 overflow-hidden">
            <img src="/logo.jpg" alt="MentorBridge Logo" className="h-full w-full object-cover" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-text-primary">
            Mentor<span className="text-brand-primary">Bridge</span>
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Enterprise Mentor–Mentee Connect Platform
          </p>
        </div>

        <Card className="border-border-default bg-bg-surface/90 backdrop-blur-xl shadow-2xl">
          <CardHeader className="pb-4 text-center">
            <CardTitle className="text-xl font-bold">Welcome Back</CardTitle>
            <CardDescription>Sign in to access your dashboard workspace</CardDescription>
          </CardHeader>

          <CardContent>
            {errorMsg && (
              <div className="mb-4 flex items-center space-x-2 rounded-lg border border-[#FF5C7A]/40 bg-danger/10 p-3 text-xs text-danger">
                <AlertCircle className="h-4 w-4 shrink-0 text-danger" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-text-muted" />
                  <Input
                    id="email"
                    autoComplete="email"
                    {...register('email')}
                    placeholder="name@company.com"
                    className="pl-9"
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-xs text-danger">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-text-muted" />
                  <Input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    {...register('password')}
                    placeholder="••••••••"
                    className="pl-9"
                  />
                </div>
                {errors.password && (
                  <p className="mt-1 text-xs text-danger">{errors.password.message}</p>
                )}
              </div>

              <Button type="submit" className="w-full h-11 text-base font-bold shadow-lg" disabled={loading}>
                {loading ? 'Authenticating...' : 'Sign In to Workspace'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </form>

            <div className="mt-6 border-t border-border-subtle pt-5 text-center">
              <p className="text-xs text-text-muted mb-2">New to MentorBridge?</p>
              <Link 
                to="/register" 
                className="inline-block w-full rounded-lg border border-border-default bg-bg-page py-2.5 text-xs font-semibold text-text-primary hover:bg-bg-surface hover:border-brand-primary/50 transition-all"
              >
                Submit Registration Application
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
