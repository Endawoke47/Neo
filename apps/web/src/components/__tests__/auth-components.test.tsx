/**
 * Authentication Components Tests
 * Tests for React authentication components
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from '../../components/auth/LoginForm';
import { RegisterForm } from '../../components/auth/RegisterForm';
import { ForgotPasswordForm } from '../../components/auth/ForgotPasswordForm';

// Mock the auth service
jest.mock('../../services/auth-secure.service', () => ({
  authService: {
    login: jest.fn(),
    register: jest.fn(),
    forgotPassword: jest.fn(),
  },
}));

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
}));

describe('LoginForm Component', () => {
  const mockOnSuccess = jest.fn();
  const mockOnError = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render login form correctly', () => {
    render(
      <LoginForm onSuccess={mockOnSuccess} onError={mockOnError} />
    );

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByText(/remember me/i)).toBeInTheDocument();
  });

  it('should validate email format', async () => {
    const user = userEvent.setup();
    render(
      <LoginForm onSuccess={mockOnSuccess} onError={mockOnError} />
    );

    const emailInput = screen.getByLabelText(/email/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await user.type(emailInput, 'invalid-email');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/invalid email format/i)).toBeInTheDocument();
    });
  });

  it('should require password field', async () => {
    const user = userEvent.setup();
    render(
      <LoginForm onSuccess={mockOnSuccess} onError={mockOnError} />
    );

    const emailInput = screen.getByLabelText(/email/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await user.type(emailInput, 'test@counselflow.com');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    });
  });

  it('should handle successful login', async () => {
    const user = userEvent.setup();
    const { authService } = require('../../services/auth-secure.service');
    
    authService.login.mockResolvedValue({
      success: true,
      tokens: {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        expiresIn: 3600,
      },
      user: {
        id: '1',
        email: 'test@counselflow.com',
        firstName: 'John',
        lastName: 'Doe',
      },
    });

    render(
      <LoginForm onSuccess={mockOnSuccess} onError={mockOnError} />
    );

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await user.type(emailInput, 'test@counselflow.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(authService.login).toHaveBeenCalledWith({
        email: 'test@counselflow.com',
        password: 'password123',
        rememberMe: false,
      });
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it('should handle login error', async () => {
    const user = userEvent.setup();
    const { authService } = require('../../services/auth-secure.service');
    
    authService.login.mockRejectedValue(new Error('Invalid credentials'));

    render(
      <LoginForm onSuccess={mockOnSuccess} onError={mockOnError} />
    );

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await user.type(emailInput, 'test@counselflow.com');
    await user.type(passwordInput, 'wrongpassword');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalledWith('Invalid credentials');
    });
  });

  it('should toggle remember me checkbox', async () => {
    const user = userEvent.setup();
    render(
      <LoginForm onSuccess={mockOnSuccess} onError={mockOnError} />
    );

    const rememberMeCheckbox = screen.getByRole('checkbox', { name: /remember me/i });
    
    expect(rememberMeCheckbox).not.toBeChecked();
    
    await user.click(rememberMeCheckbox);
    expect(rememberMeCheckbox).toBeChecked();
  });

  it('should show loading state during submission', async () => {
    const user = userEvent.setup();
    const { authService } = require('../../services/auth-secure.service');
    
    // Mock a delayed response
    authService.login.mockImplementation(() => 
      new Promise(resolve => setTimeout(resolve, 1000))
    );

    render(
      <LoginForm onSuccess={mockOnSuccess} onError={mockOnError} />
    );

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await user.type(emailInput, 'test@counselflow.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    expect(screen.getByText(/signing in/i)).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
  });
});

describe('RegisterForm Component', () => {
  const mockOnSuccess = jest.fn();
  const mockOnError = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render registration form correctly', () => {
    render(
      <RegisterForm onSuccess={mockOnSuccess} onError={mockOnError} />
    );

    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });

  it('should validate password strength', async () => {
    const user = userEvent.setup();
    render(
      <RegisterForm onSuccess={mockOnSuccess} onError={mockOnError} />
    );

    const passwordInput = screen.getByLabelText(/^password$/i);
    
    await user.type(passwordInput, 'weak');
    await user.tab(); // Trigger blur event

    await waitFor(() => {
      expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
    });
  });

  it('should validate password confirmation', async () => {
    const user = userEvent.setup();
    render(
      <RegisterForm onSuccess={mockOnSuccess} onError={mockOnError} />
    );

    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    
    await user.type(passwordInput, 'TestPassword123!');
    await user.type(confirmPasswordInput, 'DifferentPassword123!');
    await user.tab(); // Trigger blur event

    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    });
  });

  it('should handle successful registration', async () => {
    const user = userEvent.setup();
    const { authService } = require('../../services/auth-secure.service');
    
    authService.register.mockResolvedValue({
      success: true,
      message: 'Registration successful',
      user: {
        id: '1',
        email: 'test@counselflow.com',
        firstName: 'John',
        lastName: 'Doe',
      },
    });

    render(
      <RegisterForm onSuccess={mockOnSuccess} onError={mockOnError} />
    );

    // Fill out the form
    await user.type(screen.getByLabelText(/first name/i), 'John');
    await user.type(screen.getByLabelText(/last name/i), 'Doe');
    await user.type(screen.getByLabelText(/email/i), 'test@counselflow.com');
    await user.type(screen.getByLabelText(/^password$/i), 'TestPassword123!');
    await user.type(screen.getByLabelText(/confirm password/i), 'TestPassword123!');
    
    const submitButton = screen.getByRole('button', { name: /create account/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(authService.register).toHaveBeenCalledWith({
        firstName: 'John',
        lastName: 'Doe',
        email: 'test@counselflow.com',
        password: 'TestPassword123!',
        confirmPassword: 'TestPassword123!',
      });
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it('should handle registration error', async () => {
    const user = userEvent.setup();
    const { authService } = require('../../services/auth-secure.service');
    
    authService.register.mockRejectedValue(new Error('Email already exists'));

    render(
      <RegisterForm onSuccess={mockOnSuccess} onError={mockOnError} />
    );

    // Fill out the form
    await user.type(screen.getByLabelText(/first name/i), 'John');
    await user.type(screen.getByLabelText(/last name/i), 'Doe');
    await user.type(screen.getByLabelText(/email/i), 'existing@counselflow.com');
    await user.type(screen.getByLabelText(/^password$/i), 'TestPassword123!');
    await user.type(screen.getByLabelText(/confirm password/i), 'TestPassword123!');
    
    const submitButton = screen.getByRole('button', { name: /create account/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalledWith('Email already exists');
    });
  });
});

describe('ForgotPasswordForm Component', () => {
  const mockOnSuccess = jest.fn();
  const mockOnError = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render forgot password form correctly', () => {
    render(
      <ForgotPasswordForm onSuccess={mockOnSuccess} onError={mockOnError} />
    );

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send reset link/i })).toBeInTheDocument();
    expect(screen.getByText(/enter your email address/i)).toBeInTheDocument();
  });

  it('should validate email format', async () => {
    const user = userEvent.setup();
    render(
      <ForgotPasswordForm onSuccess={mockOnSuccess} onError={mockOnError} />
    );

    const emailInput = screen.getByLabelText(/email/i);
    const submitButton = screen.getByRole('button', { name: /send reset link/i });

    await user.type(emailInput, 'invalid-email');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/invalid email format/i)).toBeInTheDocument();
    });
  });

  it('should handle successful password reset request', async () => {
    const user = userEvent.setup();
    const { authService } = require('../../services/auth-secure.service');
    
    authService.forgotPassword.mockResolvedValue({
      success: true,
      message: 'Password reset email sent',
    });

    render(
      <ForgotPasswordForm onSuccess={mockOnSuccess} onError={mockOnError} />
    );

    const emailInput = screen.getByLabelText(/email/i);
    const submitButton = screen.getByRole('button', { name: /send reset link/i });

    await user.type(emailInput, 'test@counselflow.com');
    await user.click(submitButton);

    await waitFor(() => {
      expect(authService.forgotPassword).toHaveBeenCalledWith({
        email: 'test@counselflow.com',
      });
      expect(mockOnSuccess).toHaveBeenCalledWith('Password reset email sent');
    });
  });

  it('should handle forgot password error', async () => {
    const user = userEvent.setup();
    const { authService } = require('../../services/auth-secure.service');
    
    authService.forgotPassword.mockRejectedValue(new Error('Server error'));

    render(
      <ForgotPasswordForm onSuccess={mockOnSuccess} onError={mockOnError} />
    );

    const emailInput = screen.getByLabelText(/email/i);
    const submitButton = screen.getByRole('button', { name: /send reset link/i });

    await user.type(emailInput, 'test@counselflow.com');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalledWith('Server error');
    });
  });

  it('should show loading state during submission', async () => {
    const user = userEvent.setup();
    const { authService } = require('../../services/auth-secure.service');
    
    // Mock a delayed response
    authService.forgotPassword.mockImplementation(() => 
      new Promise(resolve => setTimeout(resolve, 1000))
    );

    render(
      <ForgotPasswordForm onSuccess={mockOnSuccess} onError={mockOnError} />
    );

    const emailInput = screen.getByLabelText(/email/i);
    const submitButton = screen.getByRole('button', { name: /send reset link/i });

    await user.type(emailInput, 'test@counselflow.com');
    await user.click(submitButton);

    expect(screen.getByText(/sending/i)).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
  });
});
