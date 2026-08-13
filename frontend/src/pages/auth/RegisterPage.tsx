import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import api from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Shield, ArrowRight, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';

const registerSchema = z.object({
  email: z.string().email('Valid email address is required'),
  fullName: z.string().min(2, 'Full name is required'),
  gender: z.string().min(1, 'Please select gender'),
  dob: z.string().min(10, 'Date of birth is required'),
  phone: z.string().min(7, 'Contact phone number is required'),
  address: z.string().min(5, 'Residential address is required'),
  college: z.string().min(2, 'College / University name is required'),
  degree: z.string().min(2, 'Degree program is required'),
  department: z.string().min(2, 'Department is required'),
  techStack: z.string().min(2, 'List current tech stack skills'),
  primarySkill: z.string().min(1, 'Primary programming skill is required'),
  secondarySkill: z.string().optional(),
  githubUrl: z.string().url('Must be a valid URL starting with http/https').optional().or(z.literal('')),
  linkedinUrl: z.string().url('Must be a valid URL starting with http/https').optional().or(z.literal('')),
});

type RegisterForm = z.infer<typeof registerSchema>;

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [otpTimer, setOtpTimer] = useState(0);

  // Timer effect for OTP resend
  React.useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (otpTimer > 0) {
      timer = setInterval(() => setOtpTimer(prev => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [otpTimer]);

  const {
    register,
    handleSubmit,
    trigger,
    getValues,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      gender: 'Other',
      techStack: 'Java, Spring Boot, React, TypeScript',
      primarySkill: 'Java',
      secondarySkill: 'React',
      college: 'Stanford University',
      degree: 'B.S. Computer Science',
      department: 'Software Engineering',
    },
  });

  const handleNextStep = async () => {
    let fieldsToValidate: (keyof RegisterForm)[] = [];
    if (step === 1) {
      fieldsToValidate = ['email', 'fullName', 'phone', 'dob', 'gender'];
    } else if (step === 2) {
      fieldsToValidate = ['college', 'degree', 'department', 'techStack', 'primarySkill'];
    }
    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      if (step === 3) {
        // Submit details to send OTP
        sendOtp();
      } else {
        setStep((prev) => prev + 1);
      }
    }
  };

  const sendOtp = async () => {
    const email = getValues('email');
    setLoading(true);
    setErrorMsg(null);
    try {
      await api.post('/auth/otp/send', { email, purpose: 'INTERN_REGISTRATION' });
      setStep(4); // Move to OTP step
      setOtpTimer(60);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to send verification code.');
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    const email = getValues('email');
    setLoading(true);
    setErrorMsg(null);
    try {
      await api.post('/auth/otp/verify', { email, otp, purpose: 'INTERN_REGISTRATION' });
      setStep(5); // Move to Password step
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Invalid verification code.');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: RegisterForm) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      await api.post('/auth/register', { ...data, password });
      setSuccessMsg(
        'Your registration request has been submitted successfully! Your account status is currently PENDING APPROVAL by the Batch Manager. You will be able to log in once approved.'
      );
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to submit registration. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-bg-page p-4 relative overflow-hidden">
      <div className="absolute top-1/3 left-1/4 h-96 w-96 rounded-full bg-brand-primary/5 blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/4 h-96 w-96 rounded-full bg-brand-primary/5 blur-[140px] pointer-events-none" />

      <div className="w-full max-w-2xl relative z-10 animate-fade-in my-8">
        <div className="text-center mb-6">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-bg-surface border border-border-default shadow-lg shadow-[#CFFF3D]/10 mb-2 overflow-hidden">
            <img src="/logo.jpg" alt="MentorBridge Logo" className="h-full w-full object-cover" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-text-primary">
            Intern Registration Portal
          </h1>
          <p className="text-sm text-text-muted">
            Submit your profile for batch onboarding and verification
          </p>
        </div>

        <Card className="border-border-default bg-bg-surface/90 backdrop-blur-xl shadow-2xl">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-primary">
                Step {step > 3 ? 3 : step} of 3
              </span>
              <div className="flex space-x-1.5">
                {[1, 2, 3].map((s) => (
                  <div
                    key={s}
                    className={`h-1.5 w-8 rounded-full transition-all ${
                      (s === step || (s === 3 && step > 3))
                        ? 'bg-gradient-to-r from-[#CFFF3D] to-[#62D9D0]'
                        : s < step
                        ? 'bg-success'
                        : 'bg-[#272C28]'
                    }`}
                  />
                ))}
              </div>
            </div>
            <CardTitle className="text-lg font-bold">
              {step === 1 && 'Personal Credentials'}
              {step === 2 && 'Academic Background & Core Tech Stack'}
              {step === 3 && 'Developer Profiles'}
              {step === 4 && 'Email Verification'}
              {step === 5 && 'Account Setup'}
            </CardTitle>
            <CardDescription>
              All fields are stored securely in 3NF normalized PostgreSQL tables
            </CardDescription>
          </CardHeader>

          <CardContent>
            {errorMsg && (
              <div className="mb-4 flex items-center space-x-2 rounded-lg border border-[#FF5C7A]/40 bg-danger/10 p-3 text-xs text-danger">
                <AlertCircle className="h-4 w-4 shrink-0 text-danger" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg ? (
              <div className="rounded-xl border border-[#43D39E]/40 bg-success/10 p-6 text-center animate-fade-in">
                <CheckCircle2 className="mx-auto h-12 w-12 text-success mb-3" />
                <h3 className="text-lg font-bold text-text-primary mb-2">Application Received!</h3>
                <p className="text-sm text-success/90 leading-relaxed mb-6">
                  {successMsg}
                </p>
                <Button onClick={() => navigate('/login')} className="w-full max-w-xs font-bold">
                  Return to Sign In Page
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {step === 1 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-text-secondary mb-1">
                        Full Name
                      </label>
                      <Input {...register('fullName')} placeholder="Alex Rivera" />
                      {errors.fullName && (
                        <p className="mt-1 text-xs text-danger">{errors.fullName.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-text-secondary mb-1">
                        Email Address
                      </label>
                      <Input {...register('email')} placeholder="alex@gmail.com" />
                      {errors.email && (
                        <p className="mt-1 text-xs text-danger">{errors.email.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-text-secondary mb-1">
                        Phone Number
                      </label>
                      <Input {...register('phone')} placeholder="+1-555-0192" />
                      {errors.phone && (
                        <p className="mt-1 text-xs text-danger">{errors.phone.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-text-secondary mb-1">
                        Date of Birth
                      </label>
                      <Input type="date" {...register('dob')} />
                      {errors.dob && (
                        <p className="mt-1 text-xs text-danger">{errors.dob.message}</p>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-text-secondary mb-1">
                        Gender
                      </label>
                      <select
                        {...register('gender')}
                        className="flex h-10 w-full rounded-md border border-border-default bg-bg-surface px-3 py-2 text-sm text-text-primary focus:ring-2 focus:ring-[#CFFF3D]"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other / Prefer not to say</option>
                      </select>
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-text-secondary mb-1">
                        College / University Name
                      </label>
                      <Input {...register('college')} placeholder="Stanford University" />
                      {errors.college && (
                        <p className="mt-1 text-xs text-danger">{errors.college.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-text-secondary mb-1">
                        Degree Pursuing
                      </label>
                      <Input {...register('degree')} placeholder="B.S. Computer Science" />
                      {errors.degree && (
                        <p className="mt-1 text-xs text-danger">{errors.degree.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-text-secondary mb-1">
                        Department / Specialization
                      </label>
                      <Input {...register('department')} placeholder="Software Engineering" />
                      {errors.department && (
                        <p className="mt-1 text-xs text-danger">{errors.department.message}</p>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-text-secondary mb-1">
                        Current Tech Stack (comma separated)
                      </label>
                      <Input
                        {...register('techStack')}
                        placeholder="Java, Spring Boot, React, TypeScript, SQL"
                      />
                      {errors.techStack && (
                        <p className="mt-1 text-xs text-danger">{errors.techStack.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-text-secondary mb-1">
                        Primary Programming Skill
                      </label>
                      <Input {...register('primarySkill')} placeholder="Java" />
                      {errors.primarySkill && (
                        <p className="mt-1 text-xs text-danger">{errors.primarySkill.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-text-secondary mb-1">
                        Secondary Skill (Optional)
                      </label>
                      <Input {...register('secondarySkill')} placeholder="React" />
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="grid grid-cols-1 gap-4 animate-fade-in">
                    <div>
                      <label className="block text-xs font-semibold text-text-secondary mb-1">
                        Residential Address
                      </label>
                      <Input {...register('address')} placeholder="123 Tech Avenue, Silicon Valley, CA" />
                      {errors.address && (
                        <p className="mt-1 text-xs text-danger">{errors.address.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-text-secondary mb-1">
                        GitHub Profile URL
                      </label>
                      <Input {...register('githubUrl')} placeholder="https://github.com/username" />
                      {errors.githubUrl && (
                        <p className="mt-1 text-xs text-danger">{errors.githubUrl.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-text-secondary mb-1">
                        LinkedIn Profile URL
                      </label>
                      <Input {...register('linkedinUrl')} placeholder="https://linkedin.com/in/username" />
                      {errors.linkedinUrl && (
                        <p className="mt-1 text-xs text-danger">{errors.linkedinUrl.message}</p>
                      )}
                    </div>
                  </div>
                )}

                {step === 4 && (
                  <div className="space-y-4 animate-fade-in text-center">
                    <p className="text-sm text-text-secondary mb-4">
                      We've sent a 6-digit verification code to <span className="text-text-primary font-bold">{getValues('email')}</span>
                    </p>
                    <div className="max-w-xs mx-auto">
                      <Input 
                        placeholder="Enter 6-digit code" 
                        value={otp}
                        maxLength={6}
                        onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                        className="bg-bg-input border-border-default focus:border-brand-primary font-mono text-center tracking-widest text-lg h-14"
                      />
                    </div>
                    <Button 
                      type="button"
                      variant="ghost" 
                      onClick={() => sendOtp()}
                      disabled={otpTimer > 0 || loading}
                      className="text-xs mt-2"
                    >
                      {otpTimer > 0 ? `Resend code in ${otpTimer}s` : 'Resend Code'}
                    </Button>
                  </div>
                )}

                {step === 5 && (
                  <div className="space-y-4 animate-fade-in max-w-xs mx-auto">
                    <p className="text-sm text-text-secondary mb-4 text-center">
                      Almost done! Set a password for your account.
                    </p>
                    <div className="text-left">
                      <label className="block text-xs font-semibold text-text-secondary mb-1">
                        Password
                      </label>
                      <Input 
                        type="password"
                        autoComplete="new-password"
                        placeholder="Create a strong password" 
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="bg-bg-input border-border-default focus:border-brand-primary"
                      />
                      {password.length > 0 && password.length < 6 && (
                        <p className="mt-1 text-xs text-danger">Password must be at least 6 characters</p>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex justify-between pt-4 border-t border-border-subtle mt-6">
                  {step > 1 && step < 4 ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setStep((prev) => prev - 1)}
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" /> Previous
                    </Button>
                  ) : step === 4 ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => { setStep(3); setErrorMsg(null); }}
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" /> Edit Profile
                    </Button>
                  ) : step === 5 ? (
                    <div />
                  ) : (
                    <Link to="/login">
                      <Button type="button" variant="ghost">
                        Cancel
                      </Button>
                    </Link>
                  )}

                  {step < 3 ? (
                    <Button type="button" onClick={handleNextStep}>
                      Continue <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  ) : step === 3 ? (
                    <Button type="button" onClick={handleNextStep} disabled={loading}>
                      {loading ? 'Sending OTP...' : 'Send Verification Code'}
                    </Button>
                  ) : step === 4 ? (
                    <Button type="button" onClick={verifyOtp} disabled={loading || otp.length !== 6}>
                      {loading ? 'Verifying...' : 'Verify Email'}
                    </Button>
                  ) : (
                    <Button type="submit" disabled={loading || password.length < 6} className="px-6 font-bold">
                      {loading ? 'Submitting Application...' : 'Submit Onboarding Application'}
                    </Button>
                  )}
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
