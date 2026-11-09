import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import type { ApiErrorBody } from "../types/api";

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

let refreshing: Promise<boolean> | null = null;

function refreshSession(): Promise<boolean> {
  if (!refreshing) {
    refreshing = axios
      .post("/api/auth/refresh", null, { withCredentials: true })
      .then(() => true)
      .catch(() => false)
      .finally(() => {
        refreshing = null;
      });
  }
  return refreshing;
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const request = error.config as RetriableRequest | undefined;
    const isAuthCall = request?.url?.startsWith("/auth/") ?? false;
    if (
      error.response?.status === 401 &&
      request &&
      !request.retried &&
      !isAuthCall
    ) {
      request.retried = true;
      if (await refreshSession()) {
        return api(request);
      }
    }
    return Promise.reject(error);
  },
);
