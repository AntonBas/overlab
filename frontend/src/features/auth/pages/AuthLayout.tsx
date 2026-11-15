import type { ReactNode } from "react";

interface AuthLayoutProps {
  title: string;
  children: ReactNode;
}

export function AuthLayout({ title, children }: AuthLayoutProps) {
  return (
    <div className="auth-card">
      <header className="auth-card__header">
        <img src="/favicon.svg" alt="" width={44} height={44} />
        <h1>{title}</h1>
      </header>
      {children}
    </div>
  );
}
