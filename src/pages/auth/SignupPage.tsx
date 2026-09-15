import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import { sleep } from '@/lib/utils';

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
    </svg>
  );
}

function FieldError({ msg }: { msg: string }) {
  return <p className="mt-1.5 text-xs text-red-500 animate-fade-in">{msg}</p>;
}

export default function SignupPage() {
  const navigate = useNavigate();
  const { startEmailFlow } = useAuthStore();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});
  const [loading, setLoading] = useState(false);

  function validate(): boolean {
    const e: typeof errors = {};
    if (!name.trim()) e.name = 'Full name is required';
    else if (name.trim().split(' ').length < 2) e.name = 'Please enter your first and last name';
    if (!email.trim()) e.email = 'Email address is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Enter a valid email address';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    await sleep(900);
    startEmailFlow(email.trim().toLowerCase(), name.trim());
    navigate('/verify');
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

        <h1 className="text-2xl font-bold text-gray-900 mb-1">Create account</h1>
        <p className="text-sm text-gray-500 mb-7">
          Join thousands of people who get more done with AI.
        </p>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">

          {/* Full name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5">
              Full name
            </label>
            <input
              id="name"
              type="text"
              autoComplete="name"
              autoFocus
              value={name}
              onChange={(e) => { setName(e.target.value); if (errors.name) setErrors(p => ({ ...p, name: undefined })); }}
              placeholder="Sarah Chen"
              className={`w-full h-12 px-4 rounded-lg border text-sm bg-white text-gray-900 placeholder-gray-400 transition-colors focus:ring-2 focus:ring-brand-500 focus:border-brand-500 ${errors.name ? 'border-red-400 ring-1 ring-red-300' : 'border-gray-100'}`}
            />
            {errors.name && <FieldError msg={errors.name} />}
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
              Email address
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors(p => ({ ...p, email: undefined })); }}
              placeholder="you@example.com"
              className={`w-full h-12 px-4 rounded-lg border text-sm bg-white text-gray-900 placeholder-gray-400 transition-colors focus:ring-2 focus:ring-brand-500 focus:border-brand-500 ${errors.email ? 'border-red-400 ring-1 ring-red-300' : 'border-gray-100'}`}
            />
            {errors.email && <FieldError msg={errors.email} />}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 mt-2 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? <><Spinner /><span>Sending code...</span></> : 'Continue'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-600 font-semibold hover:underline">
            Sign in
          </Link>
        </p>

        <div className="mt-6 text-center">
          <Link to="/" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
            Back to welcome
          </Link>
        </div>
      </div>
    </div>
  );
}
