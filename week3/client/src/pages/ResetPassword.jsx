import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/client';
import FormInput from '../components/FormInput';
import { validatePassword } from '../utils/validation';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const navigate = useNavigate();
  const [form, setForm] = useState({ password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((err) => ({ ...err, [name]: '' }));
    setServerError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      setServerError('Invalid reset link. Request a new one.');
      return;
    }

    const fieldErrors = {};
    const pwErr = validatePassword(form.password);
    if (pwErr) fieldErrors.password = pwErr;
    if (form.password !== form.confirmPassword) fieldErrors.confirmPassword = 'Passwords do not match.';
    if (Object.keys(fieldErrors).length) {
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, password: form.password });
      navigate('/login', { replace: true, state: { message: 'Password reset successful. Please sign in.' } });
    } catch (err) {
      setServerError(err.response?.data?.message || 'Reset failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="card w-full max-w-md">
        <h1 className="mb-1 text-2xl font-bold">Reset password</h1>
        <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">Enter your new password</p>

        {serverError && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <FormInput label="New password" name="password" type="password" value={form.password} onChange={handleChange} error={errors.password} required />
          <FormInput label="Confirm password" name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange} error={errors.confirmPassword} required />
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Updating...' : 'Update password'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm">
          <Link to="/login" className="text-brand-600 hover:underline dark:text-brand-400">
            Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}
