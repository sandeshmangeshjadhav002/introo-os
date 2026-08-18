import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import Card from "../Card";

describe("Card", () => {
  it("renders children correctly", () => {
    render(
      <Card>
        <div data-testid="child-content">Content</div>
      </Card>,
    );
    expect(screen.getByTestId("child-content")).toBeInTheDocument();
  });

  it("applies default classes", () => {
    const { container } = render(<Card>Content</Card>);
    expect(container.firstChild).toHaveClass("bg-white");
  });

  it("applies glass class when glass prop is true", () => {
    const { container } = render(<Card glass>Content</Card>);
    expect(container.firstChild).toHaveClass("glass");
    expect(container.firstChild).not.toHaveClass("bg-white");
  });

  it("applies custom className", () => {
    const { container } = render(
      <Card className="my-custom-class">Content</Card>,
    );
    expect(container.firstChild).toHaveClass("my-custom-class");
  });
});
