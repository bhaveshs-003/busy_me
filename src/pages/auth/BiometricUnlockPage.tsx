import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import { sleep } from '@/lib/utils';

type ScanState = 'idle' | 'scanning' | 'success' | 'error';

function FaceIdIcon({ state }: { state: ScanState }) {
  const ringColor =
    state === 'success' ? 'text-green-500' :
    state === 'error'   ? 'text-red-500' :
    state === 'scanning'? 'text-brand-500' :
                          'text-gray-300';

  return (
    <svg
      viewBox="0 0 80 80"
      fill="none"
      className={`w-20 h-20 transition-all duration-300 ${state === 'scanning' ? 'animate-pulse-subtle' : ''}`}
      aria-hidden="true"
    >
      {/* Outer ring */}
      <rect x="4" y="4" width="72" height="72" rx="20" stroke="currentColor" strokeWidth="3" className={`transition-colors duration-300 ${ringColor}`}/>
      {/* Corner marks */}
      <path d="M4 24 V8 Q4 4 8 4 H24" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className={`transition-colors duration-300 ${ringColor}`}/>
      <path d="M56 4 H72 Q76 4 76 8 V24" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className={`transition-colors duration-300 ${ringColor}`}/>
      <path d="M76 56 V72 Q76 76 72 76 H56" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className={`transition-colors duration-300 ${ringColor}`}/>
      <path d="M24 76 H8 Q4 76 4 72 V56" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className={`transition-colors duration-300 ${ringColor}`}/>
      {/* Face features */}
      <circle cx="28" cy="32" r="3.5" fill={state === 'success' ? '#22c55e' : state === 'error' ? '#ef4444' : state === 'scanning' ? '#f97316' : '#9ca3af'}/>
      <circle cx="52" cy="32" r="3.5" fill={state === 'success' ? '#22c55e' : state === 'error' ? '#ef4444' : state === 'scanning' ? '#f97316' : '#9ca3af'}/>
      <path d="M28 52 Q40 62 52 52" stroke={state === 'success' ? '#22c55e' : state === 'error' ? '#ef4444' : state === 'scanning' ? '#f97316' : '#9ca3af'} strokeWidth="2.5" strokeLinecap="round" fill="none"/>
      <path d="M40 36 L40 46" stroke={state === 'success' ? '#22c55e' : state === 'error' ? '#ef4444' : state === 'scanning' ? '#f97316' : '#9ca3af'} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

export default function BiometricUnlockPage() {
  const navigate = useNavigate();
  const { user, loginAsDemo } = useAuthStore();
  const [scanState, setScanState] = useState<ScanState>('idle');

  const displayName = user?.firstName ?? 'there';

  async function handleUnlock() {
    if (scanState === 'scanning') return;
    setScanState('scanning');
    await sleep(1000);
    setScanState('success');
    await sleep(500);
    navigate('/chat');
  }

  async function handleDemoLogin() {
    loginAsDemo();
    setScanState('scanning');
    await sleep(800);
    setScanState('success');
    await sleep(400);
    navigate('/chat');
  }

  const buttonLabel =
    scanState === 'scanning' ? 'Scanning...' :
    scanState === 'success'  ? 'Verified!' :
    'Unlock with Face ID';

  const buttonBg =
    scanState === 'success'  ? 'bg-green-500 hover:bg-green-500' :
    scanState === 'scanning' ? 'bg-brand-400' :
                               'bg-brand-500 hover:bg-brand-600';

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm flex flex-col items-center animate-slide-up">

        {/* Logo */}
        <div className="flex items-center gap-2 mb-12 self-start">
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

        <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">
          Welcome back{displayName !== 'there' ? `, ${displayName}` : ''}
        </h1>
        <p className="text-sm text-gray-500 text-center mb-10">
          Unlock with Face ID to continue
        </p>

        {/* Face ID icon */}
        <div
          className="cursor-pointer select-none mb-10 transition-transform duration-150 active:scale-95"
          onClick={handleUnlock}
          role="button"
          aria-label="Unlock with Face ID"
        >
          <FaceIdIcon state={scanState} />
        </div>

        {/* State label */}
        <div className="h-5 mb-6">
          {scanState === 'scanning' && (
            <p className="text-sm text-brand-600 font-medium animate-pulse-subtle">
              Looking for your face...
            </p>
          )}
          {scanState === 'success' && (
            <p className="text-sm text-green-600 font-medium animate-fade-in">
              Face recognized!
            </p>
          )}
        </div>

        {/* Unlock button */}
        <button
          type="button"
          onClick={handleUnlock}
          disabled={scanState === 'scanning' || scanState === 'success'}
          className={`w-full h-12 rounded-lg ${buttonBg} text-white text-sm font-semibold active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-2 disabled:cursor-not-allowed`}
        >
          {scanState === 'scanning' && (
            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
          )}
          {scanState === 'success' && (
            <svg className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
            </svg>
          )}
          {buttonLabel}
        </button>

        {/* Passcode fallback */}
        <Link
          to="/login"
          className="mt-4 text-sm text-gray-500 hover:text-gray-700 hover:underline transition-colors"
        >
          Use passcode instead
        </Link>

        {/* Demo shortcut */}
        <button
          type="button"
          onClick={handleDemoLogin}
          className="mt-8 text-xs text-gray-400 hover:text-gray-600 underline underline-offset-2 transition-colors"
        >
          Continue as Demo User
        </button>
      </div>
    </div>
  );
}
