import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authStore';
import Input from '../../components/atoms/Input';
import Button from '../../components/atoms/Button';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const set = (f) => (e) => setForm((s) => ({ ...s, [f]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) return toast.error('Please fill in all fields');
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/');
      toast.success('Welcome back! 🎉');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-xl p-8"
        >
          {/* Logo */}
          <div className="text-center mb-8">
            <span className="text-5xl">🥗</span>
            <h1 className="text-3xl font-black text-text-primary mt-2" style={{ fontFamily: 'Sora' }}>
              Nutri<span className="text-primary">Sense</span>
            </h1>
            <p className="text-text-muted mt-1">Your AI-powered nutrition companion</p>
          </div>

          <h2 className="text-xl font-bold text-text-primary mb-6">Welcome back</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              value={form.email}
              onChange={set('email')}
              icon={Mail}
              placeholder="you@example.com"
              required
            />
            <Input
              label="Password"
              type="password"
              value={form.password}
              onChange={set('password')}
              icon={Lock}
              placeholder="••••••••"
              required
            />

            <Button type="submit" fullWidth loading={loading} size="lg">
              Sign In
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-text-muted text-sm">
              Don't have an account?{' '}
              <Link to="/register" className="text-primary font-semibold hover:underline">
                Sign up free
              </Link>
            </p>
          </div>
        </motion.div>

        {/* Feature pills */}
        <div className="flex justify-center gap-2 mt-6 flex-wrap">
          {['🤖 AI Nutrition', '📊 Smart Insights', '🎯 Goal Tracking', '🥘 Meal Plans'].map((f) => (
            <span key={f} className="px-3 py-1.5 bg-white rounded-full text-xs text-text-muted shadow-sm">{f}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
