import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { authApi, getErrorMessage } from '@/lib/api';
import { Button, Input, Alert } from '@/components/ui';
import type { AccountType } from '@/types';
import { Activity } from 'lucide-react';

export function LoginScreen({ onNavigate }: { onNavigate: (screen: string) => void }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-200 px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-slate-900 text-white">
            <Activity className="h-7 w-7" />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-slate-900">Haven</h1>
          <p className="mt-1 text-sm text-slate-500">Healthcare Management Platform</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Sign in</h2>
          <p className="mt-1 text-sm text-slate-500">Enter your credentials to access your account</p>

          {error && <div className="mt-4"><Alert>{error}</Alert></div>}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <Input
              label="Email"
              type="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
            <Input
              label="Password"
              type="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
            <Button type="submit" loading={loading} className="w-full">
              Sign in
            </Button>
          </form>

          <div className="mt-6 space-y-2 border-t border-slate-200 pt-4 text-center text-sm text-slate-500">
            <p>
              Don't have an account?{' '}
              <button onClick={() => onNavigate('signup')} className="font-semibold text-teal-600 hover:text-teal-700">
                Sign up
              </button>
            </p>
            <p>
              Have an invitation or verification token?{' '}
              <button onClick={() => onNavigate('verify')} className="font-semibold text-teal-600 hover:text-teal-700">
                Use token
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SignupScreen({ onNavigate }: { onNavigate: (screen: string) => void }) {
  const { login } = useAuth();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    accountType: 'PATIENT' as AccountType,
  orgName: '',
    orgType: 'EMPLOYER' as string,
  phone: '',
    address: '',
    city: '',
    state: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isOrg = form.accountType === 'ORGANIZATION';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authApi.signup({
        firstName: isOrg ? form.orgName : form.firstName,
        lastName: isOrg ? '' : form.lastName,
        email: form.email,
        accountType: form.accountType,
        password: form.password,
      });
      // Auto-login after signup
      await login(form.email, form.password);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-200 px-4 py-8">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-slate-900 text-white">
            <Activity className="h-7 w-7" />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-slate-900">Create Account</h1>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
          {error && <div className="mb-4"><Alert>{error}</Alert></div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Account Type</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, accountType: 'PATIENT' })}
                  className={`rounded-lg border px-4 py-2.5 text-sm font-medium transition ${
                    form.accountType === 'PATIENT'
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  Patient
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, accountType: 'ORGANIZATION' })}
                  className={`rounded-lg border px-4 py-2.5 text-sm font-medium transition ${
                    form.accountType === 'ORGANIZATION'
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  Organization
                </button>
              </div>
            </div>

            {isOrg ? (
              <Input
                label="Organization Name"
                value={form.orgName}
                onChange={(e) => setForm({ ...form, orgName: e.target.value })}
                required
              />
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="First Name"
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  required
                />
                <Input
                  label="Last Name"
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  required
                />
              </div>
            )}

            <Input
              label="Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
            <Input
              label="Password"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />

            <Button type="submit" loading={loading} className="w-full">
              Create Account
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Already have an account?{' '}
            <button onClick={() => onNavigate('login')} className="font-semibold text-teal-600 hover:text-teal-700">
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export function VerifyScreen({ onNavigate }: { onNavigate: (screen: string) => void }) {
  const { refreshUser } = useAuth();
  const [mode, setMode] = useState<'verify' | 'invite'>('verify');
  const [token, setToken] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      if (mode === 'verify') {
        const res = await authApi.verifyEmail({ token, email: email || undefined });
        refreshUser(res.data);
        setSuccess('Email verified successfully! You can now sign in.');
      } else {
        const res = await orgApi_acceptInvitation(token);
        setSuccess(`Invitation accepted! You are now a member (role: ${res.data.role}). Please sign in.`);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-200 px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-slate-900 text-white">
            <Activity className="h-7 w-7" />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-slate-900">Token Verification</h1>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mb-6 flex gap-2">
            <button
              onClick={() => setMode('verify')}
              className={`flex-1 rounded-lg border px-4 py-2 text-sm font-medium transition ${
                mode === 'verify' ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
            >
              Verify Email
            </button>
            <button
              onClick={() => setMode('invite')}
              className={`flex-1 rounded-lg border px-4 py-2 text-sm font-medium transition ${
                mode === 'invite' ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
            >
              Accept Invitation
            </button>
          </div>

          {error && <div className="mb-4"><Alert>{error}</Alert></div>}
          {success && <div className="mb-4"><Alert type="success">{success}</Alert></div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Paste your token here"
              required
            />
            {mode === 'verify' && (
              <Input
                label="Email (optional)"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            )}
            <Button type="submit" loading={loading} className="w-full">
              {mode === 'verify' ? 'Verify Email' : 'Accept Invitation'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            <button onClick={() => onNavigate('login')} className="font-semibold text-teal-600 hover:text-teal-700">
              Back to sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

// Wrapper to avoid circular import
import { orgApi } from '@/lib/api';
async function orgApi_acceptInvitation(token: string) {
  return orgApi.acceptInvitation({ token });
}
