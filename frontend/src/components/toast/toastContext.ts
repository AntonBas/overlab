import { createContext, useContext } from "react";

export interface ToastApi {
  showSuccess: (message: string) => void;
}

export const ToastContext = createContext<ToastApi>({
  showSuccess: () => undefined,
});

export function useToast(): ToastApi {
  return useContext(ToastContext);
}
