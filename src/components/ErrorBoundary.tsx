"use client";

import React, { Component, type ReactNode } from "react";

interface Props {
  readonly children: ReactNode;
  readonly fallback?: ReactNode;
}

interface State {
  readonly hasError: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    if (process.env.NODE_ENV === "development") {
      console.error("ErrorBoundary caught:", error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="rounded-xl border border-border-subtle bg-bg-card p-8 text-center">
            <p className="text-text-secondary text-lg">
              Something went wrong loading this section.
            </p>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="mt-4 px-4 py-2 rounded-lg bg-accent-periwinkle/20 text-accent-periwinkle text-sm font-medium hover:bg-accent-periwinkle/30 transition-colors cursor-pointer"
            >
              Try again
            </button>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
