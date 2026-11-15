import clsx from "clsx";
import { useId, type ReactNode } from "react";

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
  const headingId = useId();
  return (
    <section
      className={clsx("settings-section", danger && "settings-section--danger")}
      aria-labelledby={headingId}
    >
      <h2 id={headingId}>{title}</h2>
      {description && <p className="muted">{description}</p>}
      {children}
    </section>
  );
}
