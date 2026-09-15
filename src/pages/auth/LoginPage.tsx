import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import { sleep } from '@/lib/utils';

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
    </svg>
  );
}

function Spinner({ light = false }: { light?: boolean }) {
  return (
    <svg className={`animate-spin h-4 w-4 ${light ? 'text-white' : 'text-gray-500'}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
    </svg>
  );
}

export default function LoginPage() {
  const navigate = useNavigate();
  const { startEmailFlow, loginWithSSO } = useAuthStore();

  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [loadingSSO, setLoadingSSO] = useState<'google' | 'apple' | null>(null);

  function validateEmail(): boolean {
    if (!email.trim()) { setEmailError('Email address is required'); return false; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setEmailError('Enter a valid email address'); return false; }
    setEmailError('');
    return true;
  }

  async function handleSendCode(e: FormEvent) {
    e.preventDefault();
    if (!validateEmail()) return;
    setLoadingEmail(true);
    await sleep(900);
    startEmailFlow(email.trim().toLowerCase());
    navigate('/verify');
  }

  async function handleSSO(provider: 'google' | 'apple') {
    setLoadingSSO(provider);
    await sleep(1500);
    loginWithSSO(provider);
    navigate('/chat');
  }

  const busy = loadingEmail || loadingSSO !== null;

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm animate-slide-up">

        {/* Logo */}
        <div className="flex items-center gap-2 mb-8">
          <div className="relative w-8 h-8">
            <div className="absolute inset-0 bg-brand-500 rounded-full" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-3 h-3 bg-white rounded-full" />
            </div>
          </div>
          <span className="text-xl font-bold tracking-tight text-gray-900">
            Busy<span className="text-brand-500">.</span>me
          </span>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-1">Welcome back</h1>
        <p className="text-sm text-gray-500 mb-7">Sign in to your account to continue.</p>

        {/* SSO options */}
        <div className="space-y-3 mb-5">
          <button
            type="button"
            onClick={() => handleSSO('google')}
            disabled={busy}
            className="w-full flex items-center justify-center gap-3 h-11 rounded-lg border border-gray-100 bg-white text-gray-700 text-sm font-medium hover:bg-gray-50 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loadingSSO === 'google' ? <><Spinner /><span>Connecting...</span></> : <><GoogleIcon /><span>Continue with Google</span></>}
          </button>
          <button
            type="button"
            onClick={() => handleSSO('apple')}
            disabled={busy}
            className="w-full flex items-center justify-center gap-3 h-11 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-black active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loadingSSO === 'apple' ? <><Spinner light /><span>Connecting...</span></> : <><AppleIcon /><span>Continue with Apple</span></>}
          </button>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400 font-medium">or sign in with email</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* Email form */}
        <form onSubmit={handleSendCode} noValidate>
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
              Email address
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => { setEmail(e.target.value); if (emailError) setEmailError(''); }}
              placeholder="you@example.com"
              className={`w-full h-12 px-4 rounded-lg border text-sm bg-white text-gray-900 placeholder-gray-400 transition-colors focus:ring-2 focus:ring-brand-500 focus:border-brand-500 ${emailError ? 'border-red-400 ring-1 ring-red-300' : 'border-gray-100'}`}
            />
            {emailError && <p className="mt-1.5 text-xs text-red-500 animate-fade-in">{emailError}</p>}
          </div>

          <button
            type="submit"
            disabled={busy}
            className="w-full h-12 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loadingEmail ? <><Spinner light /><span>Sending code...</span></> : 'Send code'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Don't have an account?{' '}
          <Link to="/signup" className="text-brand-600 font-semibold hover:underline">
            Sign up
          </Link>
        </p>

        <div className="mt-4 text-center">
          <Link to="/" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
            Back to welcome
          </Link>
        </div>
      </div>
    </div>
  );
}
