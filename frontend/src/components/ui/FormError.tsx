import { CircleAlert } from "lucide-react";
import type { ReactNode } from "react";

export function FormError({ children }: { children: ReactNode }) {
  return (
    <div className="form-alert" role="alert">
      <CircleAlert size={16} aria-hidden="true" />
      <p>{children}</p>
    </div>
  );
}
