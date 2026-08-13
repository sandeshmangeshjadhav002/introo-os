import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import Login from '../Login';
import { useSupabase } from '../../context/SupabaseContext';
import { useTheme } from '../../context/ThemeContext';
import userEvent from '@testing-library/user-event';

// Mock context hooks
vi.mock('../../context/SupabaseContext', () => ({
  useSupabase: vi.fn(),
}));

vi.mock('../../context/ThemeContext', () => ({
  useTheme: vi.fn(),
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('Login Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useTheme.mockReturnValue({ theme: 'light', setTheme: vi.fn() });
  });

  it('renders login form correctly', () => {
    useSupabase.mockReturnValue({ signIn: vi.fn() });
    
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/you@example.com/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/••••••••/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('handles successful login', async () => {
    const mockSignIn = vi.fn().mockResolvedValueOnce({});
    useSupabase.mockReturnValue({ signIn: mockSignIn });
    const user = userEvent.setup();

    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    const emailInput = screen.getByPlaceholderText(/you@example.com/i);
    const passwordInput = screen.getByPlaceholderText(/••••••••/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123');
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('displays error message on failed login', async () => {
    const mockSignIn = vi.fn().mockRejectedValueOnce(new Error('Invalid credentials'));
    useSupabase.mockReturnValue({ signIn: mockSignIn });
    const user = userEvent.setup();

    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    const emailInput = screen.getByPlaceholderText(/you@example.com/i);
    const passwordInput = screen.getByPlaceholderText(/••••••••/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'wrongpassword');
    await user.click(submitButton);

    expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'wrongpassword');
    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });
  });
});
