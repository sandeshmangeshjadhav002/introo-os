import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Button from '../Button';

describe('Button', () => {
  it('renders correctly with default props', () => {
    render(<Button>Click me</Button>);
    const button = screen.getByRole('button', { name: /click me/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('bg-primary');
    expect(button).toHaveClass('px-6 py-3'); // default md size
  });

  it('renders with secondary variant', () => {
    render(<Button variant="secondary">Secondary</Button>);
    const button = screen.getByRole('button', { name: /secondary/i });
    expect(button).toHaveClass('bg-gray-100');
  });

  it('renders with outline variant', () => {
    render(<Button variant="outline">Outline</Button>);
    const button = screen.getByRole('button', { name: /outline/i });
    expect(button).toHaveClass('border-gray-200');
  });

  it('renders with small size', () => {
    render(<Button size="sm">Small</Button>);
    const button = screen.getByRole('button', { name: /small/i });
    expect(button).toHaveClass('px-4 py-2 text-sm');
  });

  it('passes additional props to button element', () => {
    render(<Button disabled data-testid="custom-btn">Custom</Button>);
    const button = screen.getByTestId('custom-btn');
    expect(button).toBeDisabled();
  });
});
