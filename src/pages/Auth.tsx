import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, ArrowRight, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

const Auth: React.FC = () => {
  const navigate = useNavigate();
  const { signInWithGoogle } = useAuth();
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
      // Admin users are auto-redirected or they can navigate to admin dashboard
      navigate('/admin');
    } catch (err) {
      setError('Google authentication failed.');
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validation
    if (!email || !password) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }

    if (authMode === 'signup' && password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      // NOTE: Firebase email/password auth is not fully set up in AuthContext yet.
      // This is simulated success per the component template provided.
      console.log('Authenticating with:', { email, password, mode: authMode });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // On success
      navigate('/admin');
    } catch (err) {
      setError('Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex overflow-hidden">
      {/* LEFT SIDE - IMAGE/VISUAL */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-red-500 rounded-full mix-blend-screen filter blur-3xl animate-blob"></div>
          <div className="absolute bottom-20 right-10 w-72 h-72 bg-orange-500 rounded-full mix-blend-screen filter blur-3xl animate-blob animation-delay-2000"></div>
          <div className="absolute top-1/2 left-1/3 w-72 h-72 bg-teal-500 rounded-full mix-blend-screen filter blur-3xl animate-blob animation-delay-4000"></div>
        </div>

        {/* Content overlay */}
        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          {/* Logo/Brand */}
          <div className="flex items-center gap-3 animate-fade-in cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-500 rounded-lg flex items-center justify-center">
              <MapPin size={24} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">NovaWatch</h1>
          </div>

          {/* Main message */}
          <div className="space-y-6 animate-fade-in animation-delay-300">
            <h2 className="text-4xl md:text-5xl font-bold leading-tight">
              Real-Time Crowd Intelligence
            </h2>
            <p className="text-lg text-slate-300 max-w-md leading-relaxed">
              Make smarter decisions about when and where to go. Monitor crowd density in real-time across thousands of locations.
            </p>

            {/* Features list */}
            <div className="space-y-3 pt-4">
              {[
                { icon: '📍', text: 'Real-time location tracking' },
                { icon: '📊', text: 'Live crowd density monitoring' },
                { icon: '⏰', text: 'Smart time recommendations' },
              ].map((feature, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 text-slate-300 animate-slide-up"
                  style={{ animationDelay: `${400 + idx * 100}ms` }}
                >
                  <span className="text-2xl">{feature.icon}</span>
                  <span>{feature.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom stats */}
          <div className="grid grid-cols-3 gap-6 border-t border-slate-700 pt-8 animate-fade-in animation-delay-600">
            {[
              { number: '50K+', label: 'Daily Users' },
              { number: '500+', label: 'Locations' },
              { number: '24/7', label: 'Real-time' },
            ].map((stat, idx) => (
              <div key={idx} className="text-center">
                <p className="text-2xl font-bold text-red-500">{stat.number}</p>
                <p className="text-sm text-slate-400">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT SIDE - LOGIN FORM */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8 bg-white">
        <div className="w-full max-w-md animate-fade-in animation-delay-200">
          {/* Header */}
          <div className="mb-8 text-center lg:text-left">
            <h3 className="text-3xl font-bold text-slate-900 mb-2">
              {authMode === 'login' ? 'Welcome Back' : 'Get Started'}
            </h3>
            <p className="text-slate-600">
              {authMode === 'login'
                ? 'Sign in to your NovaWatch account'
                : 'Create a new NovaWatch account'}
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-6 p-3 bg-red-50 border-l-4 border-red-500 rounded">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Google Sign-In Button */}
          <button
            onClick={handleGoogleSignIn}
            className="w-full mb-6 py-3 px-4 border-2 border-slate-200 rounded-xl text-slate-900 font-medium transition-all duration-200 hover:border-slate-300 hover:bg-slate-50 flex items-center justify-center gap-2 group"
          >
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-slate-600">Or continue with email</span>
            </div>
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleEmailAuth} className="space-y-4">
            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                Email Address
              </label>
              <div
                className={`relative transition-all duration-200 ${
                  focusedField === 'email'
                    ? 'ring-2 ring-red-500 ring-offset-2'
                    : 'border-2 border-slate-200'
                } rounded-xl overflow-hidden`}
              >
                <Mail
                  size={18}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none"
                />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-3 bg-white text-slate-900 placeholder-slate-400 border-0 outline-none"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                  Password
                </label>
                {authMode === 'login' && (
                  <a href="#" className="text-sm text-red-600 hover:text-red-700 font-medium">
                    Forgot?
                  </a>
                )}
              </div>
              <div
                className={`relative transition-all duration-200 ${
                  focusedField === 'password'
                    ? 'ring-2 ring-red-500 ring-offset-2'
                    : 'border-2 border-slate-200'
                } rounded-xl overflow-hidden`}
              >
                <Lock
                  size={18}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none"
                />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-12 py-3 bg-white text-slate-900 placeholder-slate-400 border-0 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Confirm Password - Only for signup */}
            {authMode === 'signup' && (
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-2">
                  Confirm Password
                </label>
                <div
                  className={`relative transition-all duration-200 ${
                    focusedField === 'confirmPassword'
                      ? 'ring-2 ring-red-500 ring-offset-2'
                      : 'border-2 border-slate-200'
                  } rounded-xl overflow-hidden`}
                >
                  <Lock
                    size={18}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none"
                  />
                  <input
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onFocus={() => setFocusedField('confirmPassword')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-12 py-3 bg-white text-slate-900 placeholder-slate-400 border-0 outline-none"
                  />
                </div>
              </div>
            )}

            {/* Remember me - Only for login */}
            {authMode === 'login' && (
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-slate-300 text-red-600 cursor-pointer"
                />
                <span className="text-sm text-slate-600">Remember me</span>
              </label>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-6 py-3 px-4 bg-gradient-to-r from-red-600 to-orange-600 text-white font-semibold rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-red-500/25 hover:-translate-y-0.5 disabled:opacity-75 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>{authMode === 'login' ? 'Signing in...' : 'Creating...'}</span>
                </>
              ) : (
                <>
                  <span>{authMode === 'login' ? 'Sign In' : 'Create Account'}</span>
                  <ArrowRight
                    size={18}
                    className="transition-transform group-hover:translate-x-1"
                  />
                </>
              )}
            </button>
          </form>

          {/* Toggle Auth Mode */}
          <p className="text-center text-slate-600 text-sm mt-6">
            {authMode === 'login' ? (
              <>
                Don't have an account?{' '}
                <button
                  onClick={() => {
                    setAuthMode('signup');
                    setError('');
                  }}
                  className="text-red-600 hover:text-red-700 font-semibold transition-colors"
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button
                  onClick={() => {
                    setAuthMode('login');
                    setError('');
                  }}
                  className="text-red-600 hover:text-red-700 font-semibold transition-colors"
                >
                  Sign in
                </button>
              </>
            )}
          </p>
        </div>
      </div>

      {/* Responsive overlay for mobile */}
      <style>{`
        @keyframes blob {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }

        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-blob {
          animation: blob 7s infinite;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }

        .animation-delay-4000 {
          animation-delay: 4s;
        }

        .animate-fade-in {
          animation: fade-in 0.6s ease-out forwards;
          opacity: 0;
        }

        .animation-delay-300 {
          animation-delay: 0.3s;
        }

        .animation-delay-600 {
          animation-delay: 0.6s;
        }

        .animate-slide-up {
          animation: slide-up 0.5s ease-out forwards;
          opacity: 0;
        }

        .animation-delay-200 {
          animation-delay: 0.2s;
        }

        /* Mobile responsive */
        @media (max-width: 1024px) {
          .animate-fade-in {
            opacity: 1;
            animation: none;
          }

          .animate-slide-up {
            opacity: 1;
            animation: none;
          }
        }
      `}</style>
    </div>
  );
};

export default Auth;
