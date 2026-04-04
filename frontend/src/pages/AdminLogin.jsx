import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const formatApiErrorDetail = (detail) => {
    if (detail == null) return 'Something went wrong. Please try again.';
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail))
      return detail.map((e) => (e && typeof e.msg === 'string' ? e.msg : JSON.stringify(e))).filter(Boolean).join(' ');
    if (detail && typeof detail.msg === 'string') return detail.msg;
    return String(detail);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await login(email, password);
      if (user.role === 'admin') {
        toast.success('Welcome back, Admin');
        navigate('/admin/dashboard');
      } else {
        setError('Access denied. Admin privileges required.');
      }
    } catch (err) {
      setError(formatApiErrorDetail(err.response?.data?.detail) || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      data-testid="admin-login-page"
      className="min-h-screen bg-[#faf8f4] flex items-center justify-center px-6"
    >
      <div className="w-full max-w-md">
        {/* Back Link */}
        <Link 
          to="/"
          data-testid="back-to-home-link"
          className="inline-flex items-center gap-2 text-sm text-[#4a4a4a] hover:text-[#c9a84c] mb-8 transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Store
        </Link>

        {/* Login Card */}
        <div className="bg-white border border-[#c9a84c]/20 p-8 md:p-12">
          {/* Logo */}
          <div className="text-center mb-8">
            <h1 
              data-testid="admin-login-logo"
              className="font-serif text-3xl tracking-[0.3em] text-[#1a1a1a]"
            >
              AURUM
            </h1>
            <p className="text-sm text-[#4a4a4a] mt-2">Admin Portal</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div 
                data-testid="login-error"
                className="p-4 bg-red-50 border border-red-200 text-red-600 text-sm"
              >
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs tracking-wider uppercase text-[#4a4a4a] mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                data-testid="admin-email-input"
                required
                className="w-full px-4 py-3 border border-[#c9a84c]/20 bg-transparent focus:border-[#c9a84c] transition-colors"
                placeholder="admin@aurum.com"
              />
            </div>

            <div>
              <label className="block text-xs tracking-wider uppercase text-[#4a4a4a] mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  data-testid="admin-password-input"
                  required
                  className="w-full px-4 py-3 border border-[#c9a84c]/20 bg-transparent focus:border-[#c9a84c] transition-colors pr-12"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#4a4a4a] hover:text-[#c9a84c] transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              data-testid="admin-login-btn"
              className="w-full btn-gold py-4"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
