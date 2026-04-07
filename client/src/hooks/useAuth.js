import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';

/**
 * Hook with login/register/logout actions and loading state.
 */
export function useAuth() {
  const { login, register, logout, user, isAuthenticated } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (email, password) => {
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
      toast.success('Welcome back!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (name, email, password) => {
    setLoading(true);
    try {
      await register(name, email, password);
      navigate('/goals');
      toast.success("Account created! Let's set up your goals.");
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return { user, isAuthenticated, loading, handleLogin, handleRegister, handleLogout };
}
