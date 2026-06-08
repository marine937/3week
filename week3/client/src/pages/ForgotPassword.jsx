import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import FormInput from '../components/FormInput';
import { validateEmail } from '../utils/validation';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [devUrl, setDevUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const emailError = validateEmail(email);
    if (emailError) {
      setError(emailError);
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    setDevUrl('');

    try {
      const res = await api.post('/auth/forgot-password', { email });
      setSuccess(res.data.message);
      if (res.data.devResetUrl) setDevUrl(res.data.devResetUrl);
    } catch (err) {
      setError(err.response?.data?.message || 'Request failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="card w-full max-w-md">
        <h1 className="mb-1 text-2xl font-bold">Forgot password</h1>
        <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
          Enter your email and we&apos;ll send a reset link.
        </p>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-700 dark:bg-green-900/30 dark:text-green-300">
            {success}
            {devUrl && (
              <p className="mt-2 break-all">
                Dev link:{' '}
                <a href={devUrl} className="underline">
                  {devUrl}
                </a>
              </p>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <FormInput label="Email" name="email" type="email" value={email} onChange={(e) => { setEmail(e.target.value); setError(''); }} error={error && !email ? error : ''} required />
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Sending...' : 'Send reset link'}
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
