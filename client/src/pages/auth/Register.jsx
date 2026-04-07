import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Mail, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authStore';
import Input from '../../components/atoms/Input';
import Button from '../../components/atoms/Button';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { register } = useAuthStore();
  const navigate = useNavigate();

  const set = (f) => (e) => setForm((s) => ({ ...s, [f]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) return toast.error('Please fill in all fields');
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters');
    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      navigate('/goals');
      toast.success('Account created! Let\'s set up your goals 🎯');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
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
          <div className="text-center mb-8">
            <span className="text-5xl">🥗</span>
            <h1 className="text-3xl font-black text-text-primary mt-2" style={{ fontFamily: 'Sora' }}>
              Nutri<span className="text-primary">Sense</span>
            </h1>
            <p className="text-text-muted mt-1">Start your nutrition journey today</p>
          </div>

          <h2 className="text-xl font-bold text-text-primary mb-6">Create your account</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Full Name" type="text" value={form.name} onChange={set('name')} icon={User} placeholder="Jane Doe" required />
            <Input label="Email" type="email" value={form.email} onChange={set('email')} icon={Mail} placeholder="you@example.com" required />
            <Input label="Password" type="password" value={form.password} onChange={set('password')} icon={Lock} placeholder="min 6 characters" required />

            <Button type="submit" fullWidth loading={loading} size="lg">
              Create Account — It's Free!
            </Button>
          </form>

          <div className="mt-4 text-center">
            <p className="text-text-muted text-sm">
              Already have an account?{' '}
              <Link to="/login" className="text-primary font-semibold hover:underline">Sign in</Link>
            </p>
          </div>
        </motion.div>

        {/* Benefits */}
        <div className="mt-6 grid grid-cols-2 gap-2">
          {[
            { icon: '🤖', text: 'AI meal analysis' },
            { icon: '📊', text: 'Smart insights' },
            { icon: '🎯', text: 'Goal tracking' },
            { icon: '🏆', text: 'Gamification' },
          ].map((b) => (
            <div key={b.text} className="flex items-center gap-2 bg-white rounded-xl p-3 shadow-sm">
              <span>{b.icon}</span>
              <span className="text-xs text-text-muted">{b.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
