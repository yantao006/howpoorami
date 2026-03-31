import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import AnimatedCounter from "../AnimatedCounter";

// ── Mocks ──────────────────────────────────────────────────────────

// Mock framer-motion: render a plain span with forwarded ref and props
vi.mock("framer-motion", () => ({
  motion: {
    span: ({
      children,
      ref: _ref,
      initial: _initial,
      animate: _animate,
      transition: _transition,
      ...rest
    }: {
      children: React.ReactNode;
      ref?: React.Ref<HTMLSpanElement>;
      initial?: unknown;
      animate?: unknown;
      transition?: unknown;
      [key: string]: unknown;
    }) => <span {...rest}>{children}</span>,
  },
  useInView: () => true,
}));

// ── Tests ──────────────────────────────────────────────────────────

describe("AnimatedCounter", () => {
  it("renders with prefix and suffix", () => {
    render(<AnimatedCounter end={100} prefix="$" suffix="M" />);

    const el = screen.getByText(/\$.*M/);
    expect(el).toBeInTheDocument();
  });

  it("displays formatted number", () => {
    // With useInView mocked to true, the counter will animate.
    // After initial render the count starts at 0 and rAF runs.
    // Since jsdom doesn't truly run rAF, the initial render shows "0".
    render(<AnimatedCounter end={500} decimals={1} />);

    // The component should be in the DOM with a numeric value
    const el = screen.getByText(/\d+\.\d/);
    expect(el).toBeInTheDocument();
  });
});
