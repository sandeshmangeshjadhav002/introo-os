import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import Register from '../Register';
import { useSupabase } from '../../context/SupabaseContext';
import { useTheme } from '../../context/ThemeContext';
import userEvent from '@testing-library/user-event';

vi.mock('../../context/SupabaseContext', () => ({
  useSupabase: vi.fn(),
}));

vi.mock('../../context/ThemeContext', () => ({
  useTheme: vi.fn(),
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('Register Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useTheme.mockReturnValue({ theme: 'light', setTheme: vi.fn() });
    useSupabase.mockReturnValue({ 
      signUp: vi.fn(),
      createOrganization: vi.fn(),
      user: null,
      profile: null
    });
  });

  it('renders registration form correctly', () => {
    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );

    expect(screen.getByRole('heading', { name: /create account/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/john doe/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/you@example.com/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/••••••••/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });

  it('handles successful signup and moves to organization step', async () => {
    const mockSignUp = vi.fn().mockResolvedValueOnce({});
    useSupabase.mockReturnValue({ 
      signUp: mockSignUp,
      user: null, // Initially null
      profile: null
    });
    const user = userEvent.setup();

    const { rerender } = render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );

    const nameInput = screen.getByPlaceholderText(/john doe/i);
    const emailInput = screen.getByPlaceholderText(/you@example.com/i);
    const passwordInput = screen.getByPlaceholderText(/••••••••/i);
    const submitButton = screen.getByRole('button', { name: /create account/i });

    await user.type(nameInput, 'John Doe');
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    expect(mockSignUp).toHaveBeenCalledWith('test@example.com', 'password123', { full_name: 'John Doe', role: 'admin' });

    // Simulate user state updating after signup
    useSupabase.mockReturnValue({
      signUp: mockSignUp,
      user: { id: '123' },
      profile: null
    });

    rerender(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /create your organization/i })).toBeInTheDocument();
    });
  });
});
