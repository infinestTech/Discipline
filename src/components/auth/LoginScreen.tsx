import { useAuth } from '../../contexts/AuthContext';
import {
  ChartBarIcon,
  ShieldCheckIcon,
  BoltIcon,
  ArrowTrendingUpIcon,
} from '@heroicons/react/24/outline';

const LoginScreen = () => {
  const { signInWithGoogle, loading, error } = useAuth();

  const features = [
    {
      icon: ChartBarIcon,
      title: 'Track Progress',
      description: 'Monitor your daily habits with precision',
    },
    {
      icon: ShieldCheckIcon,
      title: 'Build Discipline',
      description: 'Develop trader-level consistency',
    },
    {
      icon: BoltIcon,
      title: 'Stay Accountable',
      description: 'Real-time sync across devices',
    },
    {
      icon: ArrowTrendingUpIcon,
      title: 'Analyze Trends',
      description: 'Weekly insights and performance metrics',
    },
  ];

  return (
    <div className="min-h-screen bg-trader-bg flex">
      {/* Left Panel - Branding & Features */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center px-12 xl:px-20 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neon-cyan/20 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-neon-green/20 rounded-full blur-3xl" />
        </div>

        {/* Content */}
        <div className="relative z-10">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-neon-cyan to-neon-green flex items-center justify-center">
              <span className="text-trader-bg font-bold text-xl">HT</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-trader-text">Habit Tracker</h1>
              <p className="text-sm text-trader-muted">Trading Discipline System</p>
            </div>
          </div>

          {/* Tagline */}
          <h2 className="text-4xl xl:text-5xl font-bold text-trader-text mb-4 leading-tight">
            Trade Your Habits
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-cyan to-neon-green">
              Like a Pro
            </span>
          </h2>
          <p className="text-lg text-trader-muted mb-12 max-w-md">
            Build unshakeable discipline with a habit tracking system designed for traders and high performers.
          </p>

          {/* Features Grid */}
          <div className="grid grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="p-4 rounded-lg bg-trader-card/50 border border-trader-border hover:border-neon-cyan/30 transition-colors"
              >
                <feature.icon className="w-8 h-8 text-neon-cyan mb-3" />
                <h3 className="font-semibold text-trader-text mb-1">{feature.title}</h3>
                <p className="text-sm text-trader-muted">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Login */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-neon-cyan to-neon-green flex items-center justify-center">
              <span className="text-trader-bg font-bold">HT</span>
            </div>
            <h1 className="text-xl font-bold text-trader-text">Habit Tracker</h1>
          </div>

          {/* Login Card */}
          <div className="trader-card p-8">
            {/* Card Header */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-neon-cyan/20 to-neon-green/20 border border-neon-cyan/30 flex items-center justify-center">
                <ShieldCheckIcon className="w-8 h-8 text-neon-cyan" />
              </div>
              <h2 className="text-2xl font-bold text-trader-text mb-2">Welcome Back</h2>
              <p className="text-trader-muted">
                Sign in to sync your trading discipline logs
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 rounded-lg bg-neon-red/10 border border-neon-red/30">
                <p className="text-sm text-neon-red text-center">{error}</p>
              </div>
            )}

            {/* Google Sign In Button */}
            <button
              onClick={signInWithGoogle}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-lg 
                       bg-white hover:bg-gray-100 transition-all duration-200
                       disabled:opacity-50 disabled:cursor-not-allowed
                       shadow-lg hover:shadow-xl"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
              ) : (
                <svg className="w-6 h-6" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
              )}
              <span className="text-gray-700 font-medium">
                {loading ? 'Signing in...' : 'Continue with Google'}
              </span>
            </button>

            {/* Divider */}
            <div className="flex items-center gap-4 my-6">
              <div className="flex-1 h-px bg-trader-border" />
              <span className="text-xs text-trader-muted uppercase tracking-wide">Secure</span>
              <div className="flex-1 h-px bg-trader-border" />
            </div>

            {/* Security Note */}
            <div className="text-center">
              <p className="text-xs text-trader-muted">
                Your data is encrypted and stored securely.
                <br />
                Only you can access your habit logs.
              </p>
            </div>
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-trader-muted mt-6">
            By signing in, you agree to our Terms of Service
            <br />
            and Privacy Policy
          </p>
        </div>
      </div>

      {/* Animated Background Grid (Right Panel) */}
      <div className="absolute inset-y-0 right-0 w-1/2 pointer-events-none overflow-hidden lg:block hidden">
        <div className="absolute inset-0 opacity-5">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `
                linear-gradient(rgba(0, 212, 255, 0.3) 1px, transparent 1px),
                linear-gradient(90deg, rgba(0, 212, 255, 0.3) 1px, transparent 1px)
              `,
              backgroundSize: '50px 50px',
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
