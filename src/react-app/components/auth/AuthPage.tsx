import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const { login, register, isLoading, error, clearError } = useAuth();

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
        loading={isLoading}
        error={error || undefined}
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
