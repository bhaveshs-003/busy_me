import { useState, useRef, useEffect, type KeyboardEvent, type ClipboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import { sleep } from '@/lib/utils';

const DEMO_CODE = '123456';
const CODE_LENGTH = 6;
const RESEND_COOLDOWN = 30;

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
    </svg>
  );
}

export default function VerifyPage() {
  const navigate = useNavigate();
  const { pendingEmail, completeAuth } = useAuthStore();

  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [resendSent, setResendSent] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const displayEmail = pendingEmail || 'your email';
  const code = digits.join('');

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  function startCooldown() {
    setCooldown(RESEND_COOLDOWN);
    timerRef.current = setInterval(() => {
      setCooldown(c => {
        if (c <= 1) { clearInterval(timerRef.current!); return 0; }
        return c - 1;
      });
    }, 1000);
  }

  function updateDigit(index: number, value: string) {
    const char = value.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[index] = char;
    setDigits(next);
    setError('');
    if (char && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
    // Auto-verify when all 6 digits filled
    const full = next.join('');
    if (full.length === CODE_LENGTH && !full.includes('')) {
      verifyCode(full);
    }
  }

  function handleKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace') {
      if (digits[index]) {
        const next = [...digits];
        next[index] = '';
        setDigits(next);
      } else if (index > 0) {
        inputRefs.current[index - 1]?.focus();
        const next = [...digits];
        next[index - 1] = '';
        setDigits(next);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, CODE_LENGTH);
    if (!pasted) return;
    const next = Array(CODE_LENGTH).fill('');
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i];
    setDigits(next);
    setError('');
    const focusIdx = Math.min(pasted.length, CODE_LENGTH - 1);
    inputRefs.current[focusIdx]?.focus();
    if (pasted.length === CODE_LENGTH) verifyCode(pasted);
  }

  async function verifyCode(codeToCheck: string = code) {
    if (codeToCheck.length < CODE_LENGTH) {
      setError('Please enter the complete 6-digit code');
      return;
    }
    setLoading(true);
    setError('');
    await sleep(1000);

    if (codeToCheck === DEMO_CODE) {
      setSuccess(true);
      await sleep(600);
      completeAuth();
      navigate('/chat', { state: { welcomeToast: true } });
    } else {
      setLoading(false);
      setError('Incorrect code. Use 123456 to continue.');
      setDigits(Array(CODE_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    }
  }

  async function handleResend() {
    if (cooldown > 0) return;
    setResendSent(true);
    setDigits(Array(CODE_LENGTH).fill(''));
    setError('');
    await sleep(600);
    setResendSent(false);
    startCooldown();
    inputRefs.current[0]?.focus();
  }

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

        {/* Email icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-brand-50 rounded-lg flex items-center justify-center">
            <svg className="w-8 h-8 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"/>
            </svg>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">Check your email</h1>
        <p className="text-sm text-gray-500 text-center mb-1">
          Enter the 6-digit code sent to
        </p>
        <p className="text-sm font-semibold text-gray-800 text-center mb-7 truncate">
          {displayEmail}
        </p>

        {/* OTP inputs */}
        <div className="flex justify-center gap-2.5 mb-3">
          {digits.map((digit, i) => (
            <input
              key={i}
              ref={(el) => { inputRefs.current[i] = el; }}
              type="text"
              inputMode="numeric"
              pattern="\d*"
              maxLength={1}
              value={digit}
              onChange={(e) => updateDigit(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              onPaste={handlePaste}
              disabled={loading || success}
              aria-label={`Digit ${i + 1}`}
              className={`w-11 h-13 text-center text-xl font-bold rounded-lg border-2 bg-white text-gray-900 transition-all focus:outline-none
                ${success
                  ? 'border-green-400 bg-gray-100 text-gray-500'
                  : error
                    ? 'border-red-400 bg-red-50'
                    : digit
                      ? 'border-brand-400 bg-brand-50 text-brand-700'
                      : 'border-gray-100 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20'
                }
                disabled:opacity-60`}
              style={{ width: '2.75rem', height: '3.25rem' }}
            />
          ))}
        </div>

        {/* Error */}
        {error && (
          <p className="text-center text-xs text-red-500 mb-4 animate-fade-in">{error}</p>
        )}

        {/* Success indicator */}
        {success && (
          <div className="flex items-center justify-center gap-2 mb-4 animate-fade-in">
            <CheckIcon />
            <span className="text-sm text-green-600 font-medium">Verified! Redirecting...</span>
          </div>
        )}

        {/* Verify button */}
        {!success && (
          <button
            type="button"
            onClick={() => verifyCode()}
            disabled={loading || code.length < CODE_LENGTH}
            className="w-full h-12 mt-2 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <><Spinner /><span>Verifying...</span></> : 'Verify'}
          </button>
        )}

        {/* Resend */}
        <div className="mt-5 text-center">
          {resendSent ? (
            <p className="text-xs text-green-600 animate-fade-in">Code resent!</p>
          ) : cooldown > 0 ? (
            <p className="text-xs text-gray-400">Resend code in <span className="font-semibold text-gray-600">{cooldown}s</span></p>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              className="text-xs text-brand-600 font-semibold hover:underline transition-colors"
            >
              Resend code
            </button>
          )}
        </div>

        {/* Demo hint */}
        <div className="mt-6 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-xs text-amber-700 text-center">
            Demo hint: use code <span className="font-bold tracking-widest">123456</span> to continue
          </p>
        </div>
      </div>
    </div>
  );
}
