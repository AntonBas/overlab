import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import type { ApiErrorBody } from "../types/common";
import {
  readSessionHint,
  writeRoleHint,
  writeSessionHint,
} from "./sessionHint";

export interface RequestFailure {
  status: number;
  message: string;
  fieldErrors: Record<string, string>;
  network: boolean;
}

export const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
});

export function toFailure(error: unknown): RequestFailure {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    const body = error.response?.data;
    const fieldErrors: Record<string, string> = {};
    body?.subErrors?.forEach((subError) => {
      fieldErrors[subError.field] = subError.message;
    });
    return {
      status: error.response?.status ?? 0,
      message: body?.message ?? error.message,
      fieldErrors,
      network: !error.response,
    };
  }
  return {
    status: 0,
    message: error instanceof Error ? error.message : "Unknown error",
    fieldErrors: {},
    network: false,
  };
}

interface RetriableRequest extends InternalAxiosRequestConfig {
  retried?: boolean;
}

const SESSION_FREE_PATHS = [
  "/auth/login",
  "/auth/register",
  "/auth/refresh",
  "/auth/logout",
  "/auth/verify-email",
  "/auth/resend-verification",
  "/auth/forgot-password",
  "/auth/reset-password",
];

let refreshing: Promise<boolean> | null = null;

function isSessionRejection(error: AxiosError): boolean {
  const status = error.response?.status;
  return status === 401 || status === 403;
}

function refreshSession(): Promise<boolean> {
  if (!refreshing) {
    refreshing = axios
      .post("/api/auth/refresh", null, { withCredentials: true })
      .then(() => {
        writeSessionHint("active");
        return true;
      })
      .catch((error: unknown) => {
        if (axios.isAxiosError(error) && isSessionRejection(error)) {
          writeSessionHint("ended");
        }
        return false;
      })
      .finally(() => {
        refreshing = null;
      });
  }
  return refreshing;
}

api.interceptors.response.use((response) => {
  const url = response.config.url ?? "";
  if (url.startsWith("/auth/login") || url.startsWith("/auth/me")) {
    writeSessionHint("active");
    const role: unknown = response.data?.role;
    writeRoleHint(typeof role === "string" ? role : null);
  } else if (url.startsWith("/auth/logout")) {
    writeSessionHint("ended");
    writeRoleHint(null);
  }
  return response;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const request = error.config as RetriableRequest | undefined;
    const isAuthCall = SESSION_FREE_PATHS.some((path) =>
      request?.url?.startsWith(path),
    );
    const noSessionToRefresh = readSessionHint() !== "active";
    if (
      error.response?.status === 401 &&
      request &&
      !request.retried &&
      !isAuthCall &&
      !noSessionToRefresh
    ) {
      request.retried = true;
      if (await refreshSession()) {
        return api(request);
      }
    }
    return Promise.reject(error);
  },
);
