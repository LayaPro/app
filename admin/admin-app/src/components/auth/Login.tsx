import React, { useState } from 'react';
import { useAppDispatch } from '../../store/index.js';
import { login } from '../../store/slices/authSlice.js';
import { Button } from '../ui/Button.js';
import { Input } from '../ui/Input.js';
import { Checkbox } from '../ui/Checkbox.js';
import { Alert } from '../ui/Alert.js';
import styles from './Login.module.css';

export const Login: React.FC = () => {
  const dispatch = useAppDispatch();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      // Make API call to login endpoint
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://fej22pbnws.ap-south-1.awsapprunner.com'}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // Check if user needs to setup password (first time login)
      if (data.requirePasswordSetup) {
        // Store setup token temporarily
        sessionStorage.setItem('setupToken', data.setupToken);
        sessionStorage.setItem('setupEmail', data.email);
        // Redirect to setup password page
        window.location.href = '/setup-password';
        return;
      }

      // Clear any existing auth data first to prevent role/data conflicts
      localStorage.clear();
      sessionStorage.clear();

      // Store token based on remember me
      if (rememberMe) {
        localStorage.setItem('token', data.token);
      } else {
        sessionStorage.setItem('token', data.token);
      }

      // Dispatch login action to Redux
      dispatch(login({
        user: data.user,
        token: data.token,
      }));

      // Force a full page reload to clear any cached state
      window.location.href = '/';

    } catch (error) {
      setErrors({
        general: error instanceof Error ? error.message : 'An error occurred during login',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginCard}>
        {/* Logo */}
        <div className={styles.logoSection}>
          <div className={styles.logo}>
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className={styles.title}>Laya Studio</h1>
          <p className={styles.subtitle}>Admin Portal</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className={styles.form}>
          <Input
            type="email"
            label="Email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
            icon={
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
              </svg>
            }
          />

          <Input
            type="password"
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
            icon={
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            }
          />

          <div className={styles.formFooter}>
            <Checkbox
              label="Remember me"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            <a href="#" className={styles.forgotPassword}>
              Forgot password?
            </a>
          </div>

          {errors.general && (
            <Alert type="error" message={errors.general} className={styles.errorAlert} />
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            isLoading={isLoading}
          >
            Sign In
          </Button>
        </form>

        {/* Footer */}
        <p className={styles.footer}>
          Don't have an account? <a href="#" className={styles.link}>Contact Administrator</a>
        </p>
      </div>
    </div>
  );
};
