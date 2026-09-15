import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import { sleep } from '@/lib/utils';

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
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

export default function WelcomePage() {
  const navigate = useNavigate();
  const { loginWithSSO, loginAsDemo } = useAuthStore();
  const [loadingSSO, setLoadingSSO] = useState<'google' | 'apple' | null>(null);

  async function handleSSO(provider: 'google' | 'apple') {
    setLoadingSSO(provider);
    await sleep(1500);
    loginWithSSO(provider);
    navigate('/chat');
  }

  const busy = loadingSSO !== null;

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm animate-slide-up">

        {/* Logo + tagline */}
        <div className="flex flex-col items-center mb-10">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="relative w-10 h-10 flex items-center justify-center">
              <div className="absolute inset-0 bg-brand-500 rounded-full" />
              <div className="relative w-4 h-4 bg-white rounded-full" />
            </div>
            <span className="text-[2rem] font-bold tracking-tight text-gray-900 leading-none">
              Busy<span className="text-brand-500">.</span>me
            </span>
          </div>
          <p className="text-sm text-gray-500 text-center mt-1 leading-relaxed">
            Your AI-powered productivity companion
          </p>
        </div>

        {/* SSO buttons */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => handleSSO('google')}
            disabled={busy}
            className="w-full flex items-center justify-center gap-3 h-12 rounded-lg border border-gray-100 bg-white text-gray-800 text-sm font-medium hover:bg-gray-50 active:scale-[0.98] transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loadingSSO === 'google' ? (
              <><Spinner /><span>Connecting to Google...</span></>
            ) : (
              <><GoogleIcon /><span>Continue with Google</span></>
            )}
          </button>

          <button
            type="button"
            onClick={() => handleSSO('apple')}
            disabled={busy}
            className="w-full flex items-center justify-center gap-3 h-12 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-black active:scale-[0.98] transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loadingSSO === 'apple' ? (
              <><Spinner light /><span>Connecting to Apple...</span></>
            ) : (
              <><AppleIcon /><span>Continue with Apple</span></>
            )}
          </button>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400 font-medium">or</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* Email sign-in */}
        <Link
          to="/login"
          className="w-full flex items-center justify-center h-12 rounded-lg border-2 border-brand-500 text-brand-600 text-sm font-semibold hover:bg-brand-50 active:scale-[0.98] transition-all duration-150"
        >
          Sign in with email
        </Link>

        {/* Create account */}
        <p className="text-center text-sm text-gray-500 mt-5">
          New to Busy.me?{' '}
          <Link to="/signup" className="text-brand-600 font-semibold hover:underline">
            Create account
          </Link>
        </p>

        {/* Demo mode */}
        <div className="mt-8 text-center">
          <button
            type="button"
            onClick={() => { loginAsDemo(); navigate('/chat'); }}
            className="text-xs text-gray-400 hover:text-gray-600 underline underline-offset-2 transition-colors"
          >
            Try Demo Mode
          </button>
        </div>

        {/* Legal */}
        <p className="text-center text-xs text-gray-400 mt-5 leading-relaxed">
          By continuing, you agree to our{' '}
          <span className="underline cursor-pointer hover:text-gray-600">Terms</span>
          {' '}and{' '}
          <span className="underline cursor-pointer hover:text-gray-600">Privacy Policy</span>
        </p>
      </div>
    </div>
  );
}
