import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import FormInput from '../components/FormInput';
import { getFieldErrors, validateEmail, validatePassword } from '../utils/validation';

export default function Login() {
  const { login, isAuthenticated } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((err) => ({ ...err, [name]: '' }));
    setServerError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fieldErrors = getFieldErrors(form, {
      email: validateEmail,
      password: (v) => (v ? '' : 'Password is required.'),
    });
    if (Object.keys(fieldErrors).length) {
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setServerError(err.response?.data?.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="absolute right-4 top-4">
        <button type="button" onClick={toggleTheme} className="btn-secondary px-3 py-2">
          {isDark ? '☀️' : '🌙'}
        </button>
      </div>
      <div className="card w-full max-w-md">
        <h1 className="mb-1 text-2xl font-bold">Welcome back</h1>
        <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">Sign in to your account</p>

        {serverError && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <FormInput label="Email" name="email" type="email" value={form.email} onChange={handleChange} error={errors.email} required />
          <FormInput label="Password" name="password" type="password" value={form.password} onChange={handleChange} error={errors.password} required />
          <div className="mb-4 text-right">
            <Link to="/forgot-password" className="text-sm text-brand-600 hover:underline dark:text-brand-400">
              Forgot password?
            </Link>
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
          No account?{' '}
          <Link to="/register" className="text-brand-600 hover:underline dark:text-brand-400">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
