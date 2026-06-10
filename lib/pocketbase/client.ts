import PocketBase from "pocketbase";

let pocketBase: PocketBase | null = null;

function isLoopbackHost(hostname: string): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

function defaultPocketBaseUrl(): string {
  if (typeof window === "undefined") {
    return "http://127.0.0.1:8090";
  }

  const { protocol, hostname } = window.location;

  if (isLoopbackHost(hostname)) {
    return "http://127.0.0.1:8090";
  }

  return `${protocol === "https:" ? "https" : "http"}://${hostname}:8090`;
}

export function getPocketBase() {
  if (typeof window === "undefined") {
    throw new Error("PocketBase client is only available in the browser.");
  }

  if (!pocketBase) {
    pocketBase = new PocketBase(pocketBaseUrl());
    pocketBase.autoCancellation(false);
  }

  return pocketBase;
}

export function pocketBaseUrl() {
  return process.env.NEXT_PUBLIC_POCKETBASE_URL || defaultPocketBaseUrl();
}

type PocketBaseErrorLike = {
  status?: number;
  message?: string;
};

export function isPocketBaseNetworkError(error: unknown): boolean {
  if (error instanceof TypeError) {
    return true;
  }

  if (error instanceof Error && error.message === "Failed to fetch") {
    return true;
  }

  return Boolean(error && typeof error === "object" && (error as PocketBaseErrorLike).status === 0);
}
