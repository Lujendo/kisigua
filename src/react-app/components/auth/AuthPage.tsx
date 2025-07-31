import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';

interface AuthPageProps {
  onNavigateToPasswordReset?: () => void;
}

const AuthPage = ({ onNavigateToPasswordReset }: AuthPageProps) => {
  const [isLogin, setIsLogin] = useState(true);
  const {
    login,
    register,
    isLoading,
    error,
    clearError,
    requiresEmailVerification,
    userEmail
  } = useAuth();

  const handleLogin = async (email: string, password: string) => {
    clearError();
    await login(email, password);
  };

  const handleRegister = async (email: string, password: string, firstName: string, lastName: string) => {
    clearError();
    await register(email, password, firstName, lastName);
  };

  const switchToRegister = () => {
    clearError();
    setIsLogin(false);
  };

  const switchToLogin = () => {
    clearError();
    setIsLogin(true);
  };

  if (isLogin) {
    return (
      <LoginForm
        onLogin={handleLogin}
        onSwitchToRegister={switchToRegister}
        onNavigateToPasswordReset={onNavigateToPasswordReset}
        loading={isLoading}
        error={error || undefined}
        requiresEmailVerification={requiresEmailVerification}
        userEmail={userEmail || undefined}
      />
    );
  }

  return (
    <RegisterForm
      onRegister={handleRegister}
      onSwitchToLogin={switchToLogin}
      loading={isLoading}
      error={error || undefined}
    />
  );
};

export default AuthPage;
