import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../../store/index.js';
import { login } from '../../store/slices/authSlice.js';
import styles from './GoogleCallback.module.css';

export const GoogleCallback = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [error, setError] = useState('');

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const errorParam = urlParams.get('error');

    if (errorParam) {
      setError('Google authentication failed. Redirecting to login...');
      setTimeout(() => navigate('/login'), 3000);
      return;
    }

    if (code) {
      handleGoogleCallback(code);
    } else {
      setError('No authorization code received. Redirecting to login...');
      setTimeout(() => navigate('/login'), 3000);
    }
  }, [navigate]);

  const handleGoogleCallback = async (code: string) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'https://fej22pbnws.ap-south-1.awsapprunner.com';
      const redirectUri = `${window.location.origin}/auth/google/callback`;
      
      const response = await fetch(`${apiUrl}/auth/google/callback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code, redirectUri }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Authentication failed');
      }

      // Clear any existing auth data
      localStorage.clear();
      sessionStorage.clear();

      // Store token
      localStorage.setItem('token', data.token);

      // Dispatch login action to Redux
      dispatch(login({
        user: data.user,
        token: data.token,
      }));

      // Redirect to dashboard
      window.location.href = '/';

    } catch (err: any) {
      console.error('Google OAuth error:', err);
      setError(err.message || 'An error occurred during authentication');
      setTimeout(() => navigate('/login'), 3000);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        {error ? (
          <div className={styles.error}>
            <svg className={styles.errorIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <h2>{error}</h2>
          </div>
        ) : (
          <div className={styles.loading}>
            <div className={styles.spinner} />
            <h2>Completing your sign in...</h2>
            <p>Please wait while we authenticate your account</p>
          </div>
        )}
      </div>
    </div>
  );
};
