"use client";

import { SessionProvider } from "next-auth/react";
import { Component, type ReactNode } from "react";
import Nav from "@/components/Nav";
import { LangProvider } from "@/lib/i18n";
import { NotificationsProvider } from "@/lib/notifications";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class AppShell extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    console.error("AppShell caught:", error);
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 p-8 text-white">
          <h1 className="text-xl font-semibold">Something went wrong</h1>
          <p className="mt-2 max-w-md text-center text-slate-400">{this.state.error.message}</p>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-6 rounded-lg px-4 py-2 text-sm font-medium text-black hover:opacity-90"
            style={{ background: "linear-gradient(180deg, #e8e8e8 0%, #c0c0c0 100%)", boxShadow: "0 0 10px rgba(192, 192, 192, 0.3)" }}
          >
            Try again
          </button>
        </div>
      );
    }
    return (
      <SessionProvider basePath="/api/auth" refetchInterval={0} refetchOnWindowFocus={false}>
        <LangProvider>
          <NotificationsProvider>
            <Nav />
            {this.props.children}
          </NotificationsProvider>
        </LangProvider>
      </SessionProvider>
    );
  }
}
