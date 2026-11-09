import clsx from "clsx";
import type { ReactNode } from "react";

interface SettingsSectionProps {
  title: string;
  description?: string;
  danger?: boolean;
  children: ReactNode;
}

export function SettingsSection({
  title,
  description,
  danger,
  children,
}: SettingsSectionProps) {
  return (
    <section
      className={clsx("settings-section", danger && "settings-section--danger")}
      aria-labelledby={`${title}-heading`}
    >
      <h2 id={`${title}-heading`}>{title}</h2>
      {description && <p className="muted">{description}</p>}
      {children}
    </section>
  );
}
